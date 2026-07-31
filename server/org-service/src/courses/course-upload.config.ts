import { memoryStorage } from 'multer';

export const courseUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allow = [
      'image/',
      'video/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (allow.some((prefix) => file.mimetype.startsWith(prefix) || file.mimetype === prefix)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image, video, PDF, Word and PowerPoint files are allowed'));
  },
};

export function buildCourseFilename(originalname: string): string {
  const ext = originalname.split('.').pop() || 'bin';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
}
