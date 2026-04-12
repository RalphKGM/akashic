import express from 'express';
import {
    PHOTO_UPLOAD_MAX_BATCH_COUNT,
} from '../config/app.config.js';
import {
    batchProcessPhotosController,
    deletePhotoController,
    getPhotoController,
    processPhotoController,
    updatePhotoDescriptionsController,
    updatePhotoPreferencesController,
    getAllPhotosController
} from '../controller/photo.controller.js';
import { mutationRateLimit } from '../middleware/rateLimit.js';
import { createImageUpload } from '../utils/uploadStorage.js';

const router = express.Router();
const upload = createImageUpload(PHOTO_UPLOAD_MAX_BATCH_COUNT);

router.post('/photo', mutationRateLimit, upload.single('image'), processPhotoController);
router.post('/photos/batch', mutationRateLimit, upload.array('images', PHOTO_UPLOAD_MAX_BATCH_COUNT), batchProcessPhotosController);
router.delete('/photo/:id', mutationRateLimit, deletePhotoController);
router.get('/photo/:id', getPhotoController);
router.get('/photos', getAllPhotosController);
router.patch('/photo/:id/descriptions', mutationRateLimit, updatePhotoDescriptionsController);
router.patch('/photo/:id/preferences', mutationRateLimit, updatePhotoPreferencesController);

export default router;
