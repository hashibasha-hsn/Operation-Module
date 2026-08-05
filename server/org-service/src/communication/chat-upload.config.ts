import { memoryStorage } from 'multer';

export const MAX_CHAT_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.spreadsheet',
  'text/csv',
  'text/plain',
]);

export const chatUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_CHAT_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(
      new Error(
        'Unsupported file type. Allowed: PDF, images, videos, Excel, PPT, Word and text files.',
      ),
    );
  },
};

export function buildChatFilename(originalname: string): string {
  const ext = originalname.split('.').pop() || 'bin';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
}

export function isAllowedChatMime(mimetype: string): boolean {
  return ALLOWED_MIME.has(mimetype);
}