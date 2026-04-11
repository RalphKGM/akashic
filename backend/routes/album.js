import express from 'express';
import {
  addPhotosToAlbumController,
  createAlbumController,
  deleteAlbumController,
  getAlbumsController,
  removePhotosFromAlbumController,
  renameAlbumController,
} from '../controller/album.controller.js';

const router = express.Router();

router.get('/albums', getAlbumsController);
router.post('/albums', createAlbumController);
router.post('/albums/:id/photos', addPhotosToAlbumController);
router.delete('/albums/:id/photos', removePhotosFromAlbumController);
router.patch('/albums/:id', renameAlbumController);
router.delete('/albums/:id', deleteAlbumController);

export default router;
