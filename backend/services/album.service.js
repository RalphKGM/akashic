import { ensureArray, ensureUuid, isUuid } from '../utils/validation.js';

export const getAlbums = async (user, supabase) => {
  const { data, error } = await supabase
    .from('album')
    .select('id, name, cover_photo_id, created_at, updated_at, album_photo(photo_id)')
    .eq('user_id', user.id);

  if (error) throw error;

  return (data || []).map((album) => ({
    id: album.id,
    name: album.name,
    cover_photo_id: album.cover_photo_id,
    created_at: album.created_at,
    updated_at: album.updated_at,
    photo_ids: (album.album_photo || []).map((row) => row.photo_id),
  }));
};

export const createAlbum = async (user, supabase, name, coverPhotoId = null) => {
  const safeName = name?.trim();
  if (!safeName) throw new Error('Album name is required');

  const { data, error } = await supabase
    .from('album')
    .insert({
      user_id: user.id,
      name: safeName,
      cover_photo_id: coverPhotoId,
    })
    .select('id, name, cover_photo_id, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
};

export const addPhotosToAlbum = async (user, supabase, albumId, photoIds = []) => {
  ensureUuid(albumId, 'Album ID');
  ensureArray(photoIds, 'photoIds');
  if (photoIds.length === 0) {
    throw new Error('photoIds is required');
  }

  const uniquePhotoIds = [...new Set(photoIds.filter(isUuid))];

  const { data: album, error: albumError } = await supabase
    .from('album')
    .select('id, user_id')
    .eq('id', albumId)
    .eq('user_id', user.id)
    .single();

  if (albumError || !album) throw new Error('Album not found');

  const { data: ownedPhotos, error: ownedPhotosError } = await supabase
    .from('photo')
    .select('id')
    .eq('user_id', user.id)
    .in('id', uniquePhotoIds);

  if (ownedPhotosError) throw ownedPhotosError;

  const ownedPhotoIdSet = new Set((ownedPhotos || []).map((p) => p.id));
  const validPhotoIds = uniquePhotoIds.filter((id) => ownedPhotoIdSet.has(id));

  if (validPhotoIds.length === 0) {
    throw new Error('No valid photos to add');
  }

  const rows = validPhotoIds.map((photoId) => ({
    album_id: albumId,
    photo_id: photoId,
  }));

  const { error } = await supabase
    .from('album_photo')
    .upsert(rows, { onConflict: 'album_id,photo_id', ignoreDuplicates: true });

  if (error) throw error;

  const latestPhotoId = validPhotoIds[validPhotoIds.length - 1] || null;
  if (latestPhotoId) {
    const { error: updateError } = await supabase
      .from('album')
      .update({ cover_photo_id: latestPhotoId })
      .eq('id', albumId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;
  }

  return {
    album_id: albumId,
    added_count: validPhotoIds.length,
    cover_photo_id: latestPhotoId,
  };
};

export const removePhotosFromAlbum = async (user, supabase, albumId, photoIds = []) => {
  ensureUuid(albumId, 'Album ID');
  ensureArray(photoIds, 'photoIds');
  if (photoIds.length === 0) {
    throw new Error('photoIds is required');
  }

  const uniquePhotoIds = [...new Set(photoIds.filter(isUuid))];

  const { data: album, error: albumError } = await supabase
    .from('album')
    .select('id, user_id')
    .eq('id', albumId)
    .eq('user_id', user.id)
    .single();

  if (albumError || !album) throw new Error('Album not found');

  const { error: deleteError, count } = await supabase
    .from('album_photo')
    .delete({ count: 'exact' })
    .eq('album_id', albumId)
    .in('photo_id', uniquePhotoIds);

  if (deleteError) throw deleteError;

  let remainingRows = null;
  let remainingError = null;

  ({ data: remainingRows, error: remainingError } = await supabase
    .from('album_photo')
    .select('photo_id, created_at')
    .eq('album_id', albumId)
    .order('created_at', { ascending: true }));

  if (remainingError) {
    ({ data: remainingRows, error: remainingError } = await supabase
      .from('album_photo')
      .select('photo_id')
      .eq('album_id', albumId));
  }

  if (remainingError) throw remainingError;

  const latestPhotoId =
    (remainingRows && remainingRows.length > 0)
      ? remainingRows[remainingRows.length - 1].photo_id
      : null;

  const { error: updateError } = await supabase
    .from('album')
    .update({ cover_photo_id: latestPhotoId })
    .eq('id', albumId)
    .eq('user_id', user.id);

  if (updateError) throw updateError;

  return {
    album_id: albumId,
    removed_count: count ?? 0,
    cover_photo_id: latestPhotoId,
  };
};

export const renameAlbum = async (user, supabase, albumId, name) => {
  const safeName = name?.trim();
  ensureUuid(albumId, 'Album ID');
  if (!safeName) throw new Error('Album name is required');

  const { data, error } = await supabase
    .from('album')
    .update({ name: safeName })
    .eq('id', albumId)
    .eq('user_id', user.id)
    .select('id, name, cover_photo_id, created_at, updated_at')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Album not found');
  return data;
};

export const deleteAlbum = async (user, supabase, albumId) => {
  ensureUuid(albumId, 'Album ID');

  const { data: album, error: albumError } = await supabase
    .from('album')
    .select('id, user_id')
    .eq('id', albumId)
    .eq('user_id', user.id)
    .single();

  if (albumError || !album) throw new Error('Album not found');

  const { error: relError } = await supabase
    .from('album_photo')
    .delete()
    .eq('album_id', albumId);

  if (relError) throw relError;

  const { error: deleteError } = await supabase
    .from('album')
    .delete()
    .eq('id', albumId)
    .eq('user_id', user.id);

  if (deleteError) throw deleteError;

  return { album_id: albumId };
};
