import express from 'express';
import multer from 'multer';
import {
    PHOTO_UPLOAD_MAX_BATCH_COUNT,
    PHOTO_UPLOAD_MAX_FILE_SIZE,
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

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
    storage, 
    limits: { fileSize: PHOTO_UPLOAD_MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (file.mimetype?.startsWith('image/')) {
            cb(null, true);
            return;
        }

        cb(new Error('Only image uploads are allowed'));
    },
});

router.post('/photo', mutationRateLimit, upload.single('image'), processPhotoController);
router.post('/photos/batch', mutationRateLimit, upload.array('images', PHOTO_UPLOAD_MAX_BATCH_COUNT), batchProcessPhotosController);
router.delete('/photo/:id', mutationRateLimit, deletePhotoController);
router.get('/photo/:id', getPhotoController);
router.get('/photos', getAllPhotosController);
router.patch('/photo/:id/descriptions', mutationRateLimit, updatePhotoDescriptionsController);
router.patch('/photo/:id/preferences', mutationRateLimit, updatePhotoPreferencesController);

export default router;
