import { memoryStorage } from 'multer';

export const entityBulkUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allow = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allow.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only CSV, XLS and XLSX files are allowed'));
  },
};