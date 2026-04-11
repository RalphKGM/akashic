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
import { ensureNonEmptyString, ensureUuid } from '../utils/validation.js';
import { createHttpError, sendErrorResponse } from '../utils/http.js';
import { PHOTO_UPLOAD_MAX_BATCH_COUNT } from '../config/app.config.js';

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
        sendErrorResponse(res, error, 'Failed to fetch photos');
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
        ensureUuid(id, 'Photo ID');

        const data = await getPhoto(user, supabase, id);

        res.status(200).json(data);

    } catch (error) {
        sendErrorResponse(res, error, 'Failed to fetch photo');
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
        ensureUuid(id, 'Photo ID');

        await deletePhoto(user, supabase, id);

        res.status(200).json({
            message: 'Photo deleted successfully',
            id
        });

    } catch (error) {
        console.error('Delete photo error:', error);
        sendErrorResponse(res, error, 'Failed to delete photo');
    }
};

export const processPhotoController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        if (!req.file) {
            throw createHttpError(400, 'No image file provided', 'PHOTO_REQUIRED');
        }

        const device_asset_id = String(req.body?.device_asset_id || '').trim() || null;

        const result = await processPhoto(user, supabase, req.file.buffer, device_asset_id);

        res.status(200).json({ message: 'Image processed successfully', photo: result });
    } catch (error) {
        if (error.message === 'DUPLICATE_IMAGE') {
            return sendErrorResponse(
                res,
                createHttpError(409, 'Duplicate image', 'DUPLICATE_IMAGE'),
                'Duplicate image'
            );
        }
        console.error('error:', error);
        sendErrorResponse(res, error, 'Failed to process image');
    }
};

export const batchProcessPhotosController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        if (!req.files || req.files.length === 0) {
            throw createHttpError(400, 'No image files provided', 'PHOTO_REQUIRED');
        }

        if (req.files.length > PHOTO_UPLOAD_MAX_BATCH_COUNT) {
            throw createHttpError(
                400,
                `Batch uploads are limited to ${PHOTO_UPLOAD_MAX_BATCH_COUNT} images`,
                'BATCH_LIMIT_EXCEEDED'
            );
        }

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
        sendErrorResponse(res, error, 'Batch processing failed');
    }
};

export const searchPhotosController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const query = ensureNonEmptyString(req.body?.query, 'Search query');

        const { results, count } = await searchPhotos(user, supabase, query);

        res.status(200).json({ results, count });
    } catch (error) {
        console.error('Search error:', error);
        sendErrorResponse(res, error, 'Search failed');
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
        ensureUuid(req.params.id, 'Photo ID');

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
        sendErrorResponse(res, err, 'Failed to update photo descriptions');
    }
};
