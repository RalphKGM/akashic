import { getCompressedImageBuffer } from '../utils/compressImage.js';
import { chatCompletionText, describeImage, generateEmbedding } from './ai.service.js';
import { detectFacesInImage } from './face.service.js';
import { parsePhotoDescription } from '../utils/photoAiParser.js';
import { logDebug, logError, logWarn } from '../utils/logger.js';

const EMBEDDING_DIMENSION = 1536;

const rerankWithGPT = async(query, candidates) => {
    if (!candidates || candidates.length === 0) return [];

    const candidateList = candidates.map((c, i) =>
        `[${i + 1}] People: ${c.faces || 'none'}\nTags: ${c.tags || 'none'}\nVisual: ${(c.literal || '').substring(0, 150)}\nContext: ${(c.descriptive || '').substring(0, 100)}`
    ).join('\n\n');

    try {
        const raw = await chatCompletionText({
            messages: [{
                role: 'user',
                content: `You are a photo search relevance judge.

Query: "${query}"

Below are photo candidates. Return the numbers of photos that match the query.

RULES:
- Be LENIENT with vague or general queries (e.g. "dog", "my pet dog") - include any photo that could reasonably match
- Be STRICT with specific queries (e.g. "dog behind gate", "valorant scoreboard") - only include exact matches
- If the query mentions a person ("me", "my", "I") but the photo has no person, still include it if the subject matches
- Prefer returning too many results over too few

${candidateList}

Reply with ONLY a comma-separated list of numbers (e.g. "1,3,5") or "none" if truly nothing matches.
Numbers only, no explanation.`
            }],
            maxTokens: 60,
            temperature: 0,
        });
        const trimmed = raw.trim();

        if (!trimmed || trimmed.toLowerCase() === 'none') return [];

        const keepIndices = new Set(
            trimmed.split(',')
               .map(n => parseInt(n.trim()) - 1)
               .filter(n => !isNaN(n) && n >= 0 && n < candidates.length)
        );

        return candidates.filter((_, i) => keepIndices.has(i));

    } catch (err) {
        logWarn('Rerank failed, returning all candidates:', err.message);
        return candidates;
    }
}

export const getAllPhotos = async (user, supabase) => {
    const { data, error } = await supabase
        .from('photo')
        .select('id, device_asset_id, descriptive, literal, tags, category, is_favorite, is_archived, is_hidden, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const getPhoto = async (user, supabase, id) => {
    const { data, error } = await supabase
        .from('photo')
        .select('id, device_asset_id, descriptive, literal, tags, category, is_favorite, is_archived, is_hidden, created_at')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) throw error;
    return data;
};

export const deletePhoto = async (user, supabase, id) => {
    if (!id) throw new Error('Photo ID is required');

    logDebug('Deleting photo id:', id);

    const { data, error } = await supabase
        .from('photo')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        logError('Delete error:', error);
        throw error;
    }

    logDebug('Photo deleted successfully:', id);
    return data;
};

export const processPhoto = async (user, supabase, image, device_asset_id) => {
    const start = Date.now();
    if (!user || !user.id) throw new Error('Invalid user object or missing user.id');

    const compressedImage = await getCompressedImageBuffer(image);
    const duplicateLookup = device_asset_id
        ? supabase.from('photo').select('id').eq('user_id', user.id).eq('device_asset_id', device_asset_id).maybeSingle()
        : Promise.resolve({ data: null });

    // Run DB lookups in parallel
    const [{ data: knownFaces }, { data: existing }] = await Promise.all([
        supabase.from('known_face').select('name, descriptor').eq('user_id', user.id),
        duplicateLookup,
    ]);

    if (existing) throw new Error('DUPLICATE_IMAGE');

    // Run describeImage and detectFaces in parallel — they're fully independent
    const [description, faces] = await Promise.all([
        describeImage(compressedImage),
        knownFaces?.length > 0
            ? detectFacesInImage(image, knownFaces)
            : Promise.resolve(null),
    ]);

    const { literal, descriptive, tags, category } = parsePhotoDescription(description);

    const [descriptiveEmbedding, literalEmbedding] = await Promise.all([
        generateEmbedding(descriptive),
        generateEmbedding(literal),
    ]);

        if (!descriptiveEmbedding || descriptiveEmbedding.length !== EMBEDDING_DIMENSION) {
        throw new Error(`Invalid descriptive embedding dimension: ${descriptiveEmbedding?.length}`);
    }
    if (!literalEmbedding || literalEmbedding.length !== EMBEDDING_DIMENSION) {
        throw new Error(`Invalid literal embedding dimension: ${literalEmbedding?.length}`);
    }

    const { data: insertData, error: insertError } = await supabase
        .from('photo')
        .insert({
            user_id: user.id,
            device_asset_id,
            descriptive,
            literal,
            tags,
            category,
            faces,
            is_favorite: false,
            is_archived: false,
            is_hidden: false,
            descriptive_embedding: descriptiveEmbedding,
            literal_embedding: literalEmbedding,
        })
        .select()
        .single();

    if (insertError) throw insertError;

    logDebug(`processPhoto: completed in ${Date.now() - start}ms`);
    return insertData;
};

export const batchProcessPhotos = async (user, supabase, files, deviceAssetIds, concurrency = 3) => {
    if (!files || files.length === 0)
        throw new Error('No image files provided');

    const ids = Array.isArray(deviceAssetIds) ? deviceAssetIds : [deviceAssetIds];

    const results = [];
    const errors = [];

    // Process in chunks of `concurrency` at a time
    for (let i = 0; i < files.length; i += concurrency) {
        const chunk = files.slice(i, i + concurrency);
        const chunkResults = await Promise.allSettled(
            chunk.map((file, j) => processPhoto(user, supabase, file.buffer, ids[i + j]))
        );

        chunkResults.forEach((outcome, j) => {
            if (outcome.status === 'fulfilled') {
                results.push({ index: i + j, photo: outcome.value });
            } else {
                errors.push({ index: i + j, error: outcome.reason?.message });
            }
        });
    }

    return { results, errors };
};

export const searchPhotos = async (user, supabase, query) => {
    const normalizedQuery = query.trim();

    const queryEmbedding = await generateEmbedding(normalizedQuery);

    const { data, error } = await supabase.rpc('hybrid_search_photos', {
        query_text: normalizedQuery,
        query_embedding: queryEmbedding,
        match_count: 20,
        user_id: user.id,
        full_text_weight: 1.0,
        semantic_weight: 2.0,
        rrf_k: 50,
    });

    logDebug(`Hybrid search results: ${data?.length ?? 0}`);
    if (error) throw error;

    if (!data || data.length === 0) return { results: [], count: 0 };

    // Fetch faces for matched photos (not in RPC result)
    const photoIds = data.map(p => p.id);
    const { data: facesData } = await supabase
        .from('photo')
        .select('id, faces')
        .in('id', photoIds);
    const facesMap = Object.fromEntries((facesData || []).map(p => [p.id, p.faces]));
    const dataWithFaces = data.map(p => ({ ...p, faces: facesMap[p.id] || null }));

    const reranked = await rerankWithGPT(normalizedQuery, dataWithFaces);

    return { results: reranked, count: reranked.length };
};

export const updatePhotoDescriptions = async ({
    supabase,
    userId,
    photoId,
    literal,
    descriptive,
}) => {
    const nextLiteral = String(literal ?? '').trim();
    const nextDescriptive = String(descriptive ?? '').trim();

    if (!nextLiteral || !nextDescriptive) {
        const err = new Error('Literal and descriptive are required');
        err.status = 400;
        throw err;
    }

    const { data: photo, error: fetchError } = await supabase
        .from('photo')
        .select('id')
        .eq('id', photoId)
        .eq('user_id', userId)
        .single();

    if (fetchError || !photo) {
        const err = new Error('Photo not found');
        err.status = 404;
        throw err;
    }

    const [literalEmbedding, descriptiveEmbedding] = await Promise.all([
        generateEmbedding(nextLiteral),
        generateEmbedding(nextDescriptive),
    ]);

    const { data: updated, error: updateError } = await supabase
        .from('photo')
        .update({
            literal: nextLiteral,
            descriptive: nextDescriptive,
            literal_embedding: literalEmbedding,
            descriptive_embedding: descriptiveEmbedding,
            updated_at: new Date().toISOString(),
        })
        .eq('id', photoId)
        .eq('user_id', userId)
        .select('id, device_asset_id, descriptive, literal, tags, category, is_favorite, is_archived, is_hidden, created_at, updated_at')
        .single();

    if (updateError) throw updateError;

    return updated;
};

export const updatePhotoPreferences = async ({
    supabase,
    userId,
    photoId,
    isFavorite,
    isArchived,
    isHidden,
}) => {
    const updates = {};

    if (typeof isFavorite === 'boolean') updates.is_favorite = isFavorite;
    if (typeof isArchived === 'boolean') updates.is_archived = isArchived;
    if (typeof isHidden === 'boolean') updates.is_hidden = isHidden;

    if (Object.keys(updates).length === 0) {
        const err = new Error('At least one photo preference is required');
        err.status = 400;
        throw err;
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
        .from('photo')
        .update(updates)
        .eq('id', photoId)
        .eq('user_id', userId)
        .select('id, device_asset_id, descriptive, literal, tags, category, is_favorite, is_archived, is_hidden, created_at, updated_at')
        .single();

    if (error || !updated) {
        const err = new Error('Photo not found');
        err.status = 404;
        throw err;
    }

    return updated;
};
