import express from 'express';
import { registerFaceController, getKnownFacesController, deleteFaceController } from '../controller/face.controller.js';
import { mutationRateLimit } from '../middleware/rateLimit.js';
import { createImageUpload } from '../utils/uploadStorage.js';

const router = express.Router();
const upload = createImageUpload();

router.get('/faces', getKnownFacesController);
router.post('/faces/register', mutationRateLimit, upload.single('image'), registerFaceController);
router.delete('/faces/:id', mutationRateLimit, deleteFaceController);

export default router;
