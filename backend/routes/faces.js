import express from 'express';
import multer from 'multer';
import { registerFaceController, getKnownFacesController, deleteFaceController } from '../controller/face.controller.js';
import { PHOTO_UPLOAD_MAX_FILE_SIZE } from '../config/app.config.js';
import { mutationRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PHOTO_UPLOAD_MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(new Error('Only image uploads are allowed'));
  },
});

router.get('/faces', getKnownFacesController);
router.post('/faces/register', mutationRateLimit, upload.single('image'), registerFaceController);
router.delete('/faces/:id', mutationRateLimit, deleteFaceController);

export default router;
