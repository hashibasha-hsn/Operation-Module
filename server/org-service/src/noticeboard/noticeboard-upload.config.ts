import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage } from 'multer';

export const NOTICEboard_UPLOAD_DIR = join(process.cwd(), 'uploads', 'noticeboard');

if (!existsSync(NOTICEboard_UPLOAD_DIR)) {
  mkdirSync(NOTICEboard_UPLOAD_DIR, { recursive: true });
}

export const noticeboardUploadOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, NOTICEboard_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image and video files are allowed'));
  },
};

export function buildNoticeboardFileUrl(filename: string): string {
  return `/uploads/noticeboard/${filename}`;
}
