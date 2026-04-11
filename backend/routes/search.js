import express from 'express';
import { searchPhotosController } from '../controller/photo.controller.js';

const router = express.Router();

router.post('/photos/search', searchPhotosController);

export default router;
