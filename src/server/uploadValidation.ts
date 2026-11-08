/**
 * MKR Academy - Secure File Upload Validation (Improvement 16)
 * Validates file sizes, allowed extensions, MIME types, and magic numbers.
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFileName?: string;
  detectedType?: string;
}

export const UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_PDF_SIZE_BYTES: 60 * 1024 * 1024,   // 60 MB
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  ALLOWED_PDF_EXTENSIONS: ['.pdf'],
  ALLOWED_IMAGE_MIMES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_PDF_MIMES: ['application/pdf'],
  BLOCKED_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.sh', '.bash', '.php', '.phtml', '.php5',
    '.js', '.mjs', '.cjs', '.html', '.htm', '.svg', '.jar', '.jsp',
    '.vbs', '.scr', '.msi', '.dll'
  ]
};

/**
 * Validates a file's name, extension, declared MIME type, and size
 */
export function validateFileMetadata(params: {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  expectedCategory: 'image' | 'pdf';
}): FileValidationResult {
  const { fileName, fileSizeBytes, mimeType, expectedCategory } = params;

  if (!fileName || typeof fileName !== 'string') {
    return { isValid: false, error: 'File name is missing or invalid' };
  }

  // 1. Sanitize file name (remove path traversal attempts and dangerous characters)
  const baseName = fileName.replace(/[/\\?%*:|"<>]/g, '_').trim();
  const lowerName = baseName.toLowerCase();

  // 2. Reject blocked extensions immediately
  const isBlocked = UPLOAD_LIMITS.BLOCKED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (isBlocked) {
    return {
      isValid: false,
      error: 'Security alert: Executable or script files are strictly prohibited.'
    };
  }

  // 3. Category-specific validation
  if (expectedCategory === 'pdf') {
    // PDF Size Check
    if (fileSizeBytes <= 0 || fileSizeBytes > UPLOAD_LIMITS.MAX_PDF_SIZE_BYTES) {
      return {
        isValid: false,
        error: `PDF file size must be between 1 KB and ${UPLOAD_LIMITS.MAX_PDF_SIZE_BYTES / (1024 * 1024)} MB.`
      };
    }

    // PDF Extension Check
    const hasValidPdfExt = UPLOAD_LIMITS.ALLOWED_PDF_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasValidPdfExt) {
      return { isValid: false, error: 'Only files with .pdf extension are permitted for notes.' };
    }

    // PDF MIME Type Check
    if (mimeType && mimeType !== 'application/pdf') {
      return { isValid: false, error: `Invalid MIME type (${mimeType}) for PDF document.` };
    }

    return {
      isValid: true,
      sanitizedFileName: baseName,
      detectedType: 'application/pdf'
    };
  }

  if (expectedCategory === 'image') {
    // Image Size Check
    if (fileSizeBytes <= 0 || fileSizeBytes > UPLOAD_LIMITS.MAX_IMAGE_SIZE_BYTES) {
      return {
        isValid: false,
        error: `Image file size must be between 1 KB and ${UPLOAD_LIMITS.MAX_IMAGE_SIZE_BYTES / (1024 * 1024)} MB.`
      };
    }

    // Image Extension Check
    const hasValidImgExt = UPLOAD_LIMITS.ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasValidImgExt) {
      return {
        isValid: false,
        error: 'Only .jpg, .jpeg, .png, and .webp images are permitted for covers and banners.'
      };
    }

    // Image MIME Type Check
    if (mimeType && !UPLOAD_LIMITS.ALLOWED_IMAGE_MIMES.includes(mimeType)) {
      return { isValid: false, error: `Invalid image MIME type: ${mimeType}` };
    }

    return {
      isValid: true,
      sanitizedFileName: baseName,
      detectedType: mimeType
    };
  }

  return { isValid: false, error: 'Unknown file upload category' };
}

/**
 * Validates binary buffer magic bytes (header signatures)
 */
export function validateFileMagicBytes(buffer: Buffer, category: 'image' | 'pdf'): boolean {
  if (!buffer || buffer.length < 4) return false;

  if (category === 'pdf') {
    // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46)
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    );
  }

  if (category === 'image') {
    // PNG: 0x89 0x50 0x4E 0x47
    const isPng = (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47
    );
    if (isPng) return true;

    // JPEG: 0xFF 0xD8 0xFF
    const isJpeg = (
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
    if (isJpeg) return true;

    // WebP: RIFF ... WEBP
    const isWebP = (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && // RIFF
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50  // WEBP
    );
    if (isWebP) return true;

    return false;
  }

  return false;
}
