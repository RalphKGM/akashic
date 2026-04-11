import express from 'express';
import multer from 'multer';
import {
    batchProcessPhotosController,
    deletePhotoController,
    getPhotoController,
    processPhotoController,
    updatePhotoDescriptionsController,
    getAllPhotosController
} from '../controller/photo.controller.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
    storage, 
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype?.startsWith('image/')) {
            cb(null, true);
            return;
        }

        cb(new Error('Only image uploads are allowed'));
    },
});

router.post('/photo', upload.single('image'), processPhotoController);
router.post('/photos/batch', upload.array('images', 50), batchProcessPhotosController);
router.delete('/photo/:id', deletePhotoController);
router.get('/photo/:id', getPhotoController);
router.get('/photos', getAllPhotosController);
router.patch('/photo/:id/descriptions', updatePhotoDescriptionsController);

export default router;
