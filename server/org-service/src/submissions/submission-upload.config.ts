import { memoryStorage } from 'multer';

export const submissionUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allow = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/csv',
      'text/plain',
    ];
    if (allow.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF, Excel, Word, PowerPoint, CSV, text and image files are allowed'));
  },
};

export function buildSubmissionFilename(originalname: string): string {
  const ext = originalname.split('.').pop() || 'bin';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
}
