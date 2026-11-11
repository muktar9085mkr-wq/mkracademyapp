package com.mkr.academy;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import java.net.URISyntaxException;

/**
 * MKR Academy - Production Java Android WebView Activity
 * 
 * Handles Razorpay UPI intent payments (GPay, PhonePe, Paytm, BHIM)
 */
public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private final String websiteUrl = "https://ais-dev-thkxnkewcmofcvdrlseylg-476803681048.asia-southeast1.run.app";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);

        setupWebSettings();
        setupWebViewClient();
        setupDownloadListener();
        setupBackNavigation();

        if (savedInstanceState == null) {
            webView.loadUrl(websiteUrl);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebSettings() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        String defaultUserAgent = settings.getUserAgentString();
        settings.setUserAgentString(defaultUserAgent + " MKRAcademyApp/1.0");
    }

    private void setupWebViewClient() {
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    return handleUrlScheme(request.getUrl().toString());
                }
                return false;
            }

            @Deprecated
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null) {
                    return handleUrlScheme(url);
                }
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
            }
        });

        webView.setWebChromeClient(new WebChromeClient());
    }

    /**
     * Intercepts UPI intent schemes (upi://, tez://, phonepe://, paytmmp://, intent://)
     */
    private boolean handleUrlScheme(String url) {
        if (url == null) return false;

        // 1. HTTP/HTTPS stays in WebView
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return false;
        }

        // 2. Direct UPI schemes
        if (url.startsWith("upi://") ||
            url.startsWith("tez://") ||
            url.startsWith("phonepe://") ||
            url.startsWith("paytmmp://") ||
            url.startsWith("paytm://") ||
            url.startsWith("bhim://")) {
            return launchIntentUri(url);
        }

        // 3. Android Intent scheme
        if (url.startsWith("intent://")) {
            return launchAndroidIntent(url);
        }

        // 4. WhatsApp, Tel, Mailto
        if (url.startsWith("whatsapp://") || url.startsWith("tel:") || url.startsWith("mailto:")) {
            return launchIntentUri(url);
        }

        return false;
    }

    private boolean launchIntentUri(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
            return true;
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "No supported UPI application found. Please install Google Pay, PhonePe, or Paytm.", Toast.LENGTH_LONG).show();
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return true;
        }
    }

    private boolean launchAndroidIntent(String intentUrl) {
        try {
            Intent intent = Intent.parseUri(intentUrl, Intent.URI_INTENT_SCHEME);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            intent.setComponent(null);
            intent.setSelector(null);

            if (intent.resolveActivity(getPackageManager()) != null) {
                startActivity(intent);
                return true;
            }

            String fallbackUrl = intent.getStringExtra("browser_fallback_url");
            if (fallbackUrl != null && !fallbackUrl.isEmpty()) {
                webView.loadUrl(fallbackUrl);
                return true;
            }

            String packageName = intent.getPackage();
            if (packageName != null && !packageName.isEmpty()) {
                try {
                    Intent marketIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + packageName));
                    startActivity(marketIntent);
                    return true;
                } catch (ActivityNotFoundException e) {
                    Intent playStoreIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + packageName));
                    startActivity(playStoreIntent);
                    return true;
                }
            }
        } catch (URISyntaxException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return true;
    }

    private void setupDownloadListener() {
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setData(Uri.parse(url));
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } catch (Exception e) {
                try {
                    android.app.DownloadManager.Request request = new android.app.DownloadManager.Request(Uri.parse(url));
                    request.setMimeType(mimetype);
                    request.addRequestHeader("User-Agent", userAgent);
                    request.setDescription("Downloading MKR Academy Educational Notes");
                    request.setTitle(android.webkit.URLUtil.guessFileName(url, contentDisposition, mimetype));
                    request.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(
                        android.os.Environment.DIRECTORY_DOWNLOADS,
                        android.webkit.URLUtil.guessFileName(url, contentDisposition, mimetype)
                    );
                    android.app.DownloadManager dm = (android.app.DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(getApplicationContext(), "Downloading Note...", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception ex) {
                    Toast.makeText(getApplicationContext(), "Failed to start download.", Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }
}
