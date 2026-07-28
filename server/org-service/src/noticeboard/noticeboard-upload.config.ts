import { memoryStorage } from 'multer';

export const noticeboardUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image and video files are allowed'));
  },
};

export function buildNoticeboardFilename(originalname: string): string {
  const ext = originalname.split('.').pop() || 'bin';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
}
