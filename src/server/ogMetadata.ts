import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Request } from 'express';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product } from '../types';
import { INITIAL_PRODUCTS, INITIAL_FREE_NOTES } from '../services/productService';
import { sanitizeId } from './sanitize';

export interface OgProductMeta {
  id: string;
  title: string;
  pageTitle: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  url: string;
  siteName: string;
  type: 'product' | 'website';
  priceAmount: string;
  currency: 'INR';
  isFree: boolean;
  subject?: string;
  classLevel?: string;
  medium?: string;
}

const DEFAULT_SITE_NAME = 'MKR Academy';
const DEFAULT_TITLE = 'MKR Academy — Educational Notes & HSLC 2027 Preparation';
const DEFAULT_DESCRIPTION =
  'Quality educational notes, chapter-wise study materials, and HSLC 2027 preparation for Class 10 & 9 students in Assamese and English mediums.';
const FIRESTORE_FETCH_TIMEOUT_MS = 3500;

let cachedProdHtmlTemplate: string | null = null;

/**
 * Escapes arbitrary strings for safe interpolation inside HTML attributes and tags.
 */
export function escapeHtmlAttr(value: string): string {
  return String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

/**
 * Safely encodes JSON-LD content to prevent premature </script> breakout.
 */
function serializeSafeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Resolves the canonical public origin from incoming request headers or environment.
 * Prevents Host-header injection by validating hostname characters strictly.
 */
export function resolvePublicOrigin(req: Request): string {
  const rawHost =
    (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim() ||
    (req.headers.host as string)?.trim() ||
    '';

  const safeHostMatch = rawHost.match(/^[a-zA-Z0-9.-]+(?::[0-9]{1,5})?$/);
  if (safeHostMatch) {
    const host = safeHostMatch[0];
    const isLocalHost =
      host.startsWith('localhost') ||
      host.startsWith('127.0.0.1') ||
      host.startsWith('0.0.0.0');
    const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
    const protocol = forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : isLocalHost
        ? 'http'
        : 'https';
    return `${protocol}://${host}`;
  }

  const envUrl = (process.env.URL || process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    return envUrl;
  }

  return 'https://mkracademy.in';
}

/**
 * Resolves a publicly accessible HTTPS/HTTP image URL for social crawlers.
 * Rejects data:/blob:/javascript: URIs and resolves relative paths against origin.
 */
export function resolveOgImageUrl(rawPath: string | undefined | null, origin: string): string {
  const fallbackUrl = `${origin}/icon-512.png`;
  if (!rawPath || typeof rawPath !== 'string') return fallbackUrl;

  const trimmed = rawPath.trim();
  if (!trimmed) return fallbackUrl;

  // Reject inline base64, blob URLs, or unsafe schemes
  if (/^(data|blob|javascript|vbscript|file):/i.test(trimmed)) {
    return fallbackUrl;
  }

  if (trimmed.startsWith('/')) {
    return `${origin}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return fallbackUrl;
    }
    return parsed.toString();
  } catch {
    return fallbackUrl;
  }
}

/**
 * Formats a clean, crawler-friendly product description (under ~190 chars)
 * including price info when helpful so WhatsApp/Telegram previews show pricing.
 */
function formatProductDescription(product: Partial<Product>, sellingRupees: number, isFree: boolean): string {
  const baselineMatch = [...INITIAL_PRODUCTS, ...INITIAL_FREE_NOTES].find((p) => p.id === product.id);
  const rawCandidate =
    product.shortDescription?.trim() ||
    product.description?.trim() ||
    baselineMatch?.shortDescription?.trim() ||
    baselineMatch?.description?.trim() ||
    '';

  const raw = rawCandidate
    ? rawCandidate
        .replace(/[•▪◦●]/g, ' ')
        .replace(/\r?\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
    : [
        product.title || DEFAULT_SITE_NAME,
        [product.subject, product.classLevel, product.medium].filter(Boolean).join(' • '),
        product.pageCount ? `${product.pageCount} Pages PDF Notes` : 'Study Notes PDF',
        `on ${DEFAULT_SITE_NAME}`
      ]
        .filter(Boolean)
        .join(' — ');

  const priceTag = isFree ? 'Free PDF' : `Price: ₹${sellingRupees}`;
  const hasPriceAlready = raw.includes('₹') || /\bfree\b/i.test(raw);
  const suffixParts: string[] = [];
  if (!hasPriceAlready) suffixParts.push(priceTag);
  if (product.classLevel && !raw.toLowerCase().includes(product.classLevel.toLowerCase())) {
    suffixParts.push(product.classLevel);
  }
  if (product.subject && !raw.toLowerCase().includes(product.subject.toLowerCase())) {
    suffixParts.push(product.subject);
  }

  const suffix = suffixParts.length > 0 ? ` (${suffixParts.join(' • ')})` : '';
  const maxBaseLen = Math.max(80, 185 - suffix.length);
  const baseText =
    raw.length > maxBaseLen ? raw.slice(0, maxBaseLen - 1).trimEnd() + '…' : raw;

  return `${baseText}${suffix}`.trim();
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      })
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Looks up an authentic published product from Cloud Firestore (`products` or `freeNotes`),
 * falling back cleanly to baseline official MKR Academy catalog items.
 */
export async function fetchProductForOg(rawProductId: string): Promise<Product | null> {
  const productId = sanitizeId(rawProductId);
  if (!productId) return null;

  // 1. Live lookup in Firestore `products` collection
  const productSnap = await withTimeout(
    getDoc(doc(db, 'products', productId)),
    FIRESTORE_FETCH_TIMEOUT_MS
  );
  if (productSnap && productSnap.exists()) {
    const data = productSnap.data() as Product;
    if (data.published === false) return null;
    return { ...data, id: productSnap.id };
  }

  // 2. Live lookup in Firestore `freeNotes` collection
  const freeSnap = await withTimeout(
    getDoc(doc(db, 'freeNotes', productId)),
    FIRESTORE_FETCH_TIMEOUT_MS
  );
  if (freeSnap && freeSnap.exists()) {
    const data = freeSnap.data() as Product;
    if (data.published === false) return null;
    return { ...data, id: freeSnap.id, isFree: true };
  }

  // 3. Fallback to official baseline catalog by ID or slug
  const baselinePool = [...INITIAL_PRODUCTS, ...INITIAL_FREE_NOTES];
  const matchedBaseline = baselinePool.find(
    (item) => (item.id === productId || item.slug === productId) && item.published !== false
  );
  return matchedBaseline || null;
}

/**
 * Builds structured Open Graph & Twitter Card metadata for a resolved product.
 */
export function buildProductOgMeta(product: Product, origin: string): OgProductMeta {
  const sellingPaise = Number(product.sellingPricePaise ?? 0);
  const isFree = Boolean(product.isFree || sellingPaise <= 0);
  const sellingRupees = isFree ? 0 : Math.round(sellingPaise / 100);
  const priceAmount = isFree ? '0.00' : (sellingPaise / 100).toFixed(2);

  const title = (product.title || DEFAULT_SITE_NAME).trim();
  const pageTitle = `${title} — ${DEFAULT_SITE_NAME}`;
  const description = formatProductDescription(product, sellingRupees, isFree);
  const imageUrl = resolveOgImageUrl(product.coverImagePath, origin);
  const canonicalUrl = `${origin}/product/${encodeURIComponent(product.id)}`;

  return {
    id: product.id,
    title,
    pageTitle,
    description,
    imageUrl,
    imageAlt: `${title} — ${DEFAULT_SITE_NAME}`,
    url: canonicalUrl,
    siteName: DEFAULT_SITE_NAME,
    type: 'product',
    priceAmount,
    currency: 'INR',
    isFree,
    subject: product.subject,
    classLevel: product.classLevel,
    medium: product.medium
  };
}

/**
 * Strips static homepage meta tags and injects product-specific Open Graph,
 * Twitter Card, canonical URL, and JSON-LD tags inside <head>.
 */
export function injectOgMetaIntoHtml(
  baseHtml: string,
  meta: OgProductMeta | null,
  origin: string,
  requestPath = '/'
): string {
  const cleanedHtml = baseHtml
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/<meta[^>]+name=["']description["'][^>]*\/?>\s*/gi, '')
    .replace(/<meta[^>]+property=["'](?:og|product):[^"']*["'][^>]*\/?>\s*/gi, '')
    .replace(/<meta[^>]+name=["']twitter:[^"']*["'][^>]*\/?>\s*/gi, '')
    .replace(/<link[^>]+rel=["']canonical["'][^>]*\/?>\s*/gi, '')
    .replace(/<script[^>]+id=["']mkr-product-jsonld["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');

  const fallbackUrl = `${origin}${requestPath.startsWith('/') ? requestPath : `/${requestPath}`}`;
  const fallbackImage = `${origin}/icon-512.png`;

  let headTags: string;

  if (meta) {
    const jsonLd = serializeSafeJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: meta.title,
      description: meta.description,
      image: [meta.imageUrl],
      url: meta.url,
      brand: {
        '@type': 'Organization',
        name: DEFAULT_SITE_NAME
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: meta.currency,
        price: meta.priceAmount,
        availability: 'https://schema.org/InStock',
        url: meta.url,
        seller: {
          '@type': 'Organization',
          name: DEFAULT_SITE_NAME
        }
      }
    });

    headTags = [
      `<title>${escapeHtmlAttr(meta.pageTitle)}</title>`,
      `<meta name="description" content="${escapeHtmlAttr(meta.description)}" />`,
      `<link rel="canonical" href="${escapeHtmlAttr(meta.url)}" />`,
      `<meta property="og:title" content="${escapeHtmlAttr(meta.title)}" />`,
      `<meta property="og:description" content="${escapeHtmlAttr(meta.description)}" />`,
      `<meta property="og:image" content="${escapeHtmlAttr(meta.imageUrl)}" />`,
      ...(meta.imageUrl.startsWith('https://')
        ? [`<meta property="og:image:secure_url" content="${escapeHtmlAttr(meta.imageUrl)}" />`]
        : []),
      `<meta property="og:image:alt" content="${escapeHtmlAttr(meta.imageAlt)}" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
      `<meta property="og:url" content="${escapeHtmlAttr(meta.url)}" />`,
      `<meta property="og:type" content="product" />`,
      `<meta property="og:site_name" content="${escapeHtmlAttr(meta.siteName)}" />`,
      `<meta property="og:locale" content="en_IN" />`,
      `<meta property="product:price:amount" content="${escapeHtmlAttr(meta.priceAmount)}" />`,
      `<meta property="product:price:currency" content="INR" />`,
      `<meta property="product:availability" content="in stock" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeHtmlAttr(meta.title)}" />`,
      `<meta name="twitter:description" content="${escapeHtmlAttr(meta.description)}" />`,
      `<meta name="twitter:image" content="${escapeHtmlAttr(meta.imageUrl)}" />`,
      `<meta name="twitter:image:alt" content="${escapeHtmlAttr(meta.imageAlt)}" />`,
      `<script id="mkr-product-jsonld" type="application/ld+json">${jsonLd}</script>`
    ].join('\n    ');
  } else {
    headTags = [
      `<title>${escapeHtmlAttr(DEFAULT_TITLE)}</title>`,
      `<meta name="description" content="${escapeHtmlAttr(DEFAULT_DESCRIPTION)}" />`,
      `<link rel="canonical" href="${escapeHtmlAttr(fallbackUrl)}" />`,
      `<meta property="og:title" content="${escapeHtmlAttr(DEFAULT_TITLE)}" />`,
      `<meta property="og:description" content="${escapeHtmlAttr(DEFAULT_DESCRIPTION)}" />`,
      `<meta property="og:image" content="${escapeHtmlAttr(fallbackImage)}" />`,
      `<meta property="og:url" content="${escapeHtmlAttr(fallbackUrl)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="${escapeHtmlAttr(DEFAULT_SITE_NAME)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeHtmlAttr(DEFAULT_TITLE)}" />`,
      `<meta name="twitter:description" content="${escapeHtmlAttr(DEFAULT_DESCRIPTION)}" />`,
      `<meta name="twitter:image" content="${escapeHtmlAttr(fallbackImage)}" />`
    ].join('\n    ');
  }

  const viewportRegex = /(<meta[^>]+name=["']viewport["'][^>]*\/?>)/i;
  if (viewportRegex.test(cleanedHtml)) {
    return cleanedHtml.replace(viewportRegex, `$1\n    ${headTags}`);
  }

  return cleanedHtml.replace(/<\/head>/i, `    ${headTags}\n  </head>`);
}

/**
 * Resolves the built SPA `dist/index.html` template for Express production
 * or Netlify serverless environments, caching it in memory.
 */
export async function loadProductionHtmlTemplate(origin: string): Promise<string> {
  if (cachedProdHtmlTemplate) return cachedProdHtmlTemplate;

  const moduleDir = (() => {
    try {
      if (typeof __dirname !== 'undefined') return __dirname;
    } catch {
      // ESM runtime
    }
    try {
      if (import.meta?.url) return path.dirname(fileURLToPath(import.meta.url));
    } catch {
      // Fallback
    }
    return process.cwd();
  })();

  const candidatePaths = [
    path.resolve(process.cwd(), 'dist', 'index.html'),
    path.resolve(moduleDir, '..', '..', 'dist', 'index.html'),
    path.resolve(moduleDir, '..', 'dist', 'index.html')
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, 'utf-8');
        if (content && content.includes('id="root"')) {
          cachedProdHtmlTemplate = content;
          return content;
        }
      }
    } catch {
      // Try next path
    }
  }

  // Fallback for serverless environments where dist/index.html is hosted on static CDN
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${origin}/index.html`, {
      signal: controller.signal,
      headers: { Accept: 'text/html' }
    });
    clearTimeout(timer);
    if (res.ok) {
      const text = await res.text();
      if (text && text.includes('id="root"')) {
        cachedProdHtmlTemplate = text;
        return text;
      }
    }
  } catch {
    // Fall through to minimal shell
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${DEFAULT_TITLE}</title>
  </head>
  <body class="bg-stone-50 text-stone-900 antialiased">
    <div id="root"></div>
    <script>window.location.replace(window.location.pathname + window.location.search);</script>
  </body>
</html>`;
}

/**
 * Renders full HTML for `/product/:id` (or `?product=:id`) containing
 * server-rendered Open Graph and Twitter Card tags in the initial response.
 */
export async function renderProductPageHtml(
  rawProductId: string,
  req: Request,
  baseHtmlOverride?: string
): Promise<string> {
  const origin = resolvePublicOrigin(req);
  const productId = sanitizeId(rawProductId);
  const [product, baseHtml] = await Promise.all([
    productId ? fetchProductForOg(productId) : Promise.resolve(null),
    baseHtmlOverride ? Promise.resolve(baseHtmlOverride) : loadProductionHtmlTemplate(origin)
  ]);

  const meta = product ? buildProductOgMeta(product, origin) : null;
  const fallbackPath = productId ? `/product/${encodeURIComponent(productId)}` : '/';

  return injectOgMetaIntoHtml(baseHtml, meta, origin, fallbackPath);
}
