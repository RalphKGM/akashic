import { API_URL } from '../config/api.js';
import { getSession } from './authService.js';

export const getAlbums = async () => {
  const token = await getSession();
  const response = await fetch(`${API_URL}/api/albums`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch albums');
  return data.albums || [];
};

export const createAlbum = async ({ name, coverPhotoId = null }) => {
  const token = await getSession();
  const response = await fetch(`${API_URL}/api/albums`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      cover_photo_id: coverPhotoId,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to create album');
  return data.album;
};

export const addPhotosToAlbum = async ({ albumId, photoIds }) => {
  const token = await getSession();
  const response = await fetch(`${API_URL}/api/albums/${albumId}/photos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ photoIds }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to add photos to album');
  return data;
};

export const removePhotosFromAlbum = async ({ albumId, photoIds }) => {
  const token = await getSession();
  const response = await fetch(`${API_URL}/api/albums/${albumId}/photos`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ photoIds }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to remove photos from album');
  return data;
};

export const renameAlbum = async ({ albumId, name }) => {
  const token = await getSession();
  const response = await fetch(`${API_URL}/api/albums/${albumId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to rename album');
  return data.album;
};

export const deleteAlbum = async ({ albumId }) => {
  const token = await getSession();
  const response = await fetch(`${API_URL}/api/albums/${albumId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to delete album');
  return data;
};
