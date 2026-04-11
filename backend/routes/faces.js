import express from 'express';
import multer from 'multer';
import { registerFaceController, getKnownFacesController, deleteFaceController } from '../controller/face.controller.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(new Error('Only image uploads are allowed'));
  },
});

router.get('/faces', getKnownFacesController);
router.post('/faces/register', upload.single('image'), registerFaceController);
router.delete('/faces/:id', deleteFaceController);

export default router;
