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
    res.status(500).json({
      error: 'Failed to fetch albums',
      details: error.message,
    });
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
      return res.status(409).json({ error: 'Album name already exists' });
    }

    res.status(500).json({
      error: 'Failed to create album',
      details: error.message,
    });
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
      return res.status(404).json({ error: error.message });
    }

    if (
      error.message === 'photoIds is required' ||
      error.message === 'No valid photos to add'
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Failed to add photos to album',
      details: error.message,
    });
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
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'photoIds is required') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Failed to remove photos from album',
      details: error.message,
    });
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
      return res.status(409).json({ error: 'Album name already exists' });
    }

    if (error.message === 'Album not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Album name is required') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Failed to rename album',
      details: error.message,
    });
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
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Album ID is required') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Failed to delete album',
      details: error.message,
    });
  }
};
