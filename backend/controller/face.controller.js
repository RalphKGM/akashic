import { registerFace, detectFacesInImage } from '../services/face.service.js';
import { getClientAuthToken, getUserFromToken } from '../utils/getClientAuthToken.js';
import { ensureNonEmptyString, ensureUuid } from '../utils/validation.js';
import { createHttpError, sendErrorResponse } from '../utils/http.js';
import { logError } from '../utils/logger.js';
import { cleanupUploadedFiles, readUploadedFile } from '../utils/uploadStorage.js';

// POST /api/faces/register
export const registerFaceController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        if (!req.file) throw createHttpError(400, 'No image provided', 'PHOTO_REQUIRED');

        const name = ensureNonEmptyString(req.body?.name, 'Name');

        const imageBuffer = await readUploadedFile(req.file);
        const descriptor = (await registerFace(imageBuffer)).map(Number);

        const { data, error } = await supabase
            .from('known_face')
            .insert({
                user_id: user.id,
                name,
                descriptor, // stored as JSON array
            })
            .select('id, name, created_at')
            .single();

        if (error) throw error;
        res.status(201).json({ face: data });
    } catch (err) {
        logError('registerFace error:', err);
        sendErrorResponse(res, err, 'Failed to register face');
    } finally {
        await cleanupUploadedFiles(req.file);
    }
};

// GET /api/faces
export const getKnownFacesController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { data, error } = await supabase
            .from('known_face')
            .select('id, name, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json({ faces: data });
    } catch (err) {
        sendErrorResponse(res, err, 'Failed to fetch faces');
    }
};

// DELETE /api/faces/:id
export const deleteFaceController = async (req, res) => {
    try {
        const auth = getClientAuthToken(req, res);
        if (!auth) return;
        const { supabase, token } = auth;

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        ensureUuid(req.params.id, 'Face ID');

        const { error } = await supabase
            .from('known_face')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', user.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        sendErrorResponse(res, err, 'Failed to delete face');
    }
};
