import { getSession } from './authService.js';
import { API_URL } from '../config/api';

export const registerFace = async (name, imageUri) => {
  const token = await getSession();
  const formData = new FormData();
  formData.append('name', name);
  formData.append('image', { uri: imageUri, name: 'face.jpg', type: 'image/jpeg' });
  const res = await fetch(`${API_URL}/api/faces/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to register face');
  return data.face;
};

export const getKnownFaces = async () => {
  const token = await getSession();
  const res = await fetch(`${API_URL}/api/faces`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch faces');
  return data.faces;
};

export const deleteFace = async (id) => {
  const token = await getSession();
  const res = await fetch(`${API_URL}/api/faces/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete face');
};
