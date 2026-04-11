import {
    batchProcessPhotos,
    deletePhoto,
    getAllPhotos,
    getPhoto,
    processPhoto,
    searchPhotos,
    updatePhotoDescriptions,
} from '../services/photo.service.js';
import { getClientAuthToken, getUserFromToken } from '../utils/getClientAuthToken.js';

export const getAllPhotosController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const result = await getAllPhotos(user, supabase);
        res.status(200).json({
            count: result.length,
            result
        });
    } catch (error) {
        console.error('getAllPhotos error:', error);
        res.status(500).json({
            error: 'Failed to fetch photos',
            details: error.message,
        });
    }
};

export const getPhotoController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;

        const data = await getPhoto(user, supabase, id);

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch photo',
            details: error.message
        });
    }
};

export const deletePhotoController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Photo ID is required' });
        }

        await deletePhoto(user, supabase, id);

        res.status(200).json({
            message: 'Photo deleted successfully',
            id
        });

    } catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({
            error: 'Failed to delete photo',
            details: error.message
        });
    }
};

export const processPhotoController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        if (!req.file) return res.status(400).json({ error: 'No image file provided' });

        console.log('device_asset_id received:', req.body.device_asset_id);

        const device_asset_id = req.body.device_asset_id || null;

        const result = await processPhoto(user, supabase, req.file.buffer, device_asset_id);

        res.status(200).json({ message: 'Image processed successfully', photo: result });
    } catch (error) {
        if (error.message === 'DUPLICATE_IMAGE') {
            return res.status(409).json({ error: 'Duplicate image' });
        }
        console.error('error:', error);
        res.status(500).json({ error: 'Failed to process image' });
    }
};

export const batchProcessPhotosController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        if (!req.files || req.files.length === 0)
            return res.status(400).json({ error: 'No image files provided' });

        console.log('device_asset_ids received:', req.body.device_asset_id);

        const deviceAssetIds = Array.isArray(req.body.device_asset_id)
            ? req.body.device_asset_id
            : [req.body.device_asset_id];

        const { results, errors } = await batchProcessPhotos(user, supabase, req.files, deviceAssetIds);

        res.status(200).json({
            message: 'Batch processing complete',
            imageCount: req.files.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Batch processing error:', error);
        res.status(500).json({
            error: 'Batch processing failed',
            details: error.message
        });
    }
};

export const searchPhotosController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { query } = req.body;
        if (!query || !query.trim()) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const { results, count } = await searchPhotos(user, supabase, query);

        res.status(200).json({ results, count });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: 'Search failed',
            details: error.message
        });
    }
};

export const updatePhotoDescriptionsController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { literal, descriptive } = req.body ?? {};

        const photo = await updatePhotoDescriptions({
            supabase,
            userId: user.id,
            photoId: req.params.id,
            literal,
            descriptive,
        });

        res.json({
            message: 'Photo descriptions updated successfully',
            photo,
        });
    } catch (err) {
        console.error('Update photo descriptions error:', err);
        res.status(err.status ?? 500).json({ error: err.message });
    }
};
