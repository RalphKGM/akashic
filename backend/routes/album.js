import express from 'express';
import {
  addPhotosToAlbumController,
  createAlbumController,
  deleteAlbumController,
  getAlbumsController,
  removePhotosFromAlbumController,
  renameAlbumController,
} from '../controller/album.controller.js';
import { mutationRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/albums', getAlbumsController);
router.post('/albums', mutationRateLimit, createAlbumController);
router.post('/albums/:id/photos', mutationRateLimit, addPhotosToAlbumController);
router.delete('/albums/:id/photos', mutationRateLimit, removePhotosFromAlbumController);
router.patch('/albums/:id', mutationRateLimit, renameAlbumController);
router.delete('/albums/:id', mutationRateLimit, deleteAlbumController);

export default router;
