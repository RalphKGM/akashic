import { getClientAuthToken, getUserFromToken } from '../utils/getClientAuthToken.js';
import {
  addPhotosToAlbum,
  createAlbum,
  getAlbums,
  removePhotosFromAlbum,
  renameAlbum,
  deleteAlbum,
} from '../services/album.service.js';
import { ensureNonEmptyString, ensureUuid } from '../utils/validation.js';
import { sendErrorResponse } from '../utils/http.js';

export const getAlbumsController = async (req, res) => {
  try {
    const auth = getClientAuthToken(req, res);
    if (!auth) return;
    const { supabase, token } = auth;

    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const albums = await getAlbums(user, supabase);
    res.status(200).json({ albums });
  } catch (error) {
    sendErrorResponse(res, error, 'Failed to fetch albums');
  }
};

export const createAlbumController = async (req, res) => {
  try {
    const auth = getClientAuthToken(req, res);
    if (!auth) return;
    const { supabase, token } = auth;

    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const name = ensureNonEmptyString(req.body?.name, 'Album name');
    const coverPhotoId = req.body?.cover_photo_id ?? null;
    if (coverPhotoId) ensureUuid(coverPhotoId, 'Cover photo ID');

    const album = await createAlbum(user, supabase, name, coverPhotoId);
    res.status(201).json({ album });
  } catch (error) {
    if (error?.code === '23505') {
      return sendErrorResponse(res, { status: 409, message: 'Album name already exists', code: 'ALBUM_NAME_CONFLICT' });
    }

    sendErrorResponse(res, error, 'Failed to create album');
  }
};

export const addPhotosToAlbumController = async (req, res) => {
  try {
    const auth = getClientAuthToken(req, res);
    if (!auth) return;
    const { supabase, token } = auth;

    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id: albumId } = req.params;
    const { photoIds } = req.body || {};
    ensureUuid(albumId, 'Album ID');

    const result = await addPhotosToAlbum(user, supabase, albumId, photoIds);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Album not found') {
      return sendErrorResponse(res, { status: 404, message: error.message, code: 'ALBUM_NOT_FOUND' });
    }

    if (
      error.message === 'photoIds is required' ||
      error.message === 'No valid photos to add'
    ) {
      return sendErrorResponse(res, { status: 400, message: error.message, code: 'INVALID_PHOTO_SELECTION' });
    }

    sendErrorResponse(res, error, 'Failed to add photos to album');
  }
};

export const removePhotosFromAlbumController = async (req, res) => {
  try {
    const auth = getClientAuthToken(req, res);
    if (!auth) return;
    const { supabase, token } = auth;

    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id: albumId } = req.params;
    const { photoIds } = req.body || {};
    ensureUuid(albumId, 'Album ID');

    const result = await removePhotosFromAlbum(user, supabase, albumId, photoIds);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Album not found') {
      return sendErrorResponse(res, { status: 404, message: error.message, code: 'ALBUM_NOT_FOUND' });
    }

    if (error.message === 'photoIds is required') {
      return sendErrorResponse(res, { status: 400, message: error.message, code: 'INVALID_PHOTO_SELECTION' });
    }

    sendErrorResponse(res, error, 'Failed to remove photos from album');
  }
};

export const renameAlbumController = async (req, res) => {
  try {
    const auth = getClientAuthToken(req, res);
    if (!auth) return;
    const { supabase, token } = auth;

    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id: albumId } = req.params;
    const name = ensureNonEmptyString(req.body?.name, 'Album name');
    ensureUuid(albumId, 'Album ID');

    const album = await renameAlbum(user, supabase, albumId, name);
    res.status(200).json({ album });
  } catch (error) {
    if (error?.code === '23505') {
      return sendErrorResponse(res, { status: 409, message: 'Album name already exists', code: 'ALBUM_NAME_CONFLICT' });
    }

    if (error.message === 'Album not found') {
      return sendErrorResponse(res, { status: 404, message: error.message, code: 'ALBUM_NOT_FOUND' });
    }

    if (error.message === 'Album name is required') {
      return sendErrorResponse(res, { status: 400, message: error.message, code: 'ALBUM_NAME_REQUIRED' });
    }

    sendErrorResponse(res, error, 'Failed to rename album');
  }
};

export const deleteAlbumController = async (req, res) => {
  try {
    const auth = getClientAuthToken(req, res);
    if (!auth) return;
    const { supabase, token } = auth;

    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id: albumId } = req.params;
    ensureUuid(albumId, 'Album ID');
    const result = await deleteAlbum(user, supabase, albumId);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Album not found') {
      return sendErrorResponse(res, { status: 404, message: error.message, code: 'ALBUM_NOT_FOUND' });
    }

    if (error.message === 'Album ID is required') {
      return sendErrorResponse(res, { status: 400, message: error.message, code: 'ALBUM_ID_REQUIRED' });
    }

    sendErrorResponse(res, error, 'Failed to delete album');
  }
};
