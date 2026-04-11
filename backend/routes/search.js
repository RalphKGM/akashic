import express from 'express';
import { searchPhotosController } from '../controller/photo.controller.js';
import { searchRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/photos/search', searchRateLimit, searchPhotosController);

export default router;
