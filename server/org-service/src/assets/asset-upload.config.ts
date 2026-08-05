import { memoryStorage } from 'multer';

export const assetUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allow = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
    ];
    if (allow.some((prefix) => file.mimetype.startsWith(prefix))) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image, PDF, Word, Excel, CSV and text files are allowed'));
  },
};

export function buildAssetFilename(originalname: string): string {
  const ext = originalname.split('.').pop() || 'bin';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
}
