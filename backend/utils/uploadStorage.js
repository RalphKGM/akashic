import fs from 'fs';
import path from 'path';
import os from 'os';
import { promises as fsPromises } from 'fs';
import multer from 'multer';
import { PHOTO_UPLOAD_MAX_FILE_SIZE } from '../config/app.config.js';

const UPLOAD_TEMP_DIR = path.join(os.tmpdir(), 'ai-photo-main-uploads');
fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true });

const createFilename = (file) => {
  const ext = path.extname(file?.originalname || '') || '.bin';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${unique}${ext}`;
};

export const createImageUpload = (maxCount = null) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOAD_TEMP_DIR),
      filename: (_req, file, cb) => cb(null, createFilename(file)),
    }),
    limits: { fileSize: PHOTO_UPLOAD_MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype?.startsWith('image/')) {
        cb(null, true);
        return;
      }

      cb(new Error('Only image uploads are allowed'));
    },
  });

  return {
    single: (field) => upload.single(field),
    array: (field) => upload.array(field, maxCount ?? undefined),
  };
};

export const readUploadedFile = async (file) => {
  if (!file?.path) {
    throw new Error('Uploaded file path is missing');
  }

  return fsPromises.readFile(file.path);
};

export const cleanupUploadedFiles = async (files) => {
  const list = Array.isArray(files) ? files : files ? [files] : [];

  await Promise.all(
    list
      .filter((file) => file?.path)
      .map(async (file) => {
        try {
          await fsPromises.unlink(file.path);
        } catch {
          // Best-effort cleanup.
        }
      })
  );
};
