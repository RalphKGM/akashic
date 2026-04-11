import { Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { getSession } from './authService';
import { API_URL } from '../config/api.js';

const resolveDeviceAssetId = (photo) => {
    if (photo?.assetId) return photo.assetId;
    return null;
};

const normalizeApiError = (data, fallbackMessage) =>
  data?.error || data?.message || fallbackMessage;

export const takePhoto = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Camera and Library access are required.');
        return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (result.canceled) return;

    const photo = await MediaLibrary.createAssetAsync(result.assets[0].uri);
    const token = await getSession();

    const formData = new FormData();
    formData.append('image', {
        uri: result.assets[0].uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
    });
    formData.append('device_asset_id', photo.id);

    try {
      const response = await fetch(`${API_URL}/api/photo`, {
        method: 'POST',
        body: formData,
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      if (response.status === 409 || data?.error === 'Duplicate image') {
        return { duplicate: true };
      }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process photo');
      }

      return {
        device_asset_id: photo.id || photo.assetId || photo.device_asset_id || null,
        uri: result.assets[0].uri,
        descriptive: data.photo?.descriptive || null,
        literal: data.photo?.literal || null,
        id: data.photo?.id || null,
        category: data.photo?.category,
        tags: data.photo?.tags,
        is_favorite: data.photo?.is_favorite ?? false,
        is_archived: data.photo?.is_archived ?? false,
        is_hidden: data.photo?.is_hidden ?? false,
        created_at: data.photo?.created_at || null,
      };
    } catch (error) {
        console.log("Upload failed", error);
        throw error;
    }
};

export const processSinglePhoto = async (photo) => {
    const token = await getSession();
    const assetId = resolveDeviceAssetId(photo);

    const formData = new FormData();
    formData.append('image', { uri: photo.uri, name: 'photo.jpg', type: 'image/jpeg' });
    formData.append('device_asset_id', assetId);

    const response = await fetch(`${API_URL}/api/photo`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json();

    if (response.status === 409 || data?.error === 'Duplicate image') {
        return { duplicate: true };
    }
    if (!response.ok) {
        throw new Error(normalizeApiError(data, 'Failed to process photo'));
    }
    return data;
};

export const processPhotos = async (photos) => {
    const token = await getSession();

    if (!photos || photos.length === 0) throw new Error("No photos selected");

    const assets = photos.map((photo) => {
        console.log('Upload', photo)
        const assetId = resolveDeviceAssetId(photo);
        return { ...photo, resolvedAssetId: assetId };
    });

    const formData = new FormData();

    if (assets.length === 1) {
        formData.append('image', {
            uri: assets[0].uri,
            name: 'photo.jpg',
            type: 'image/jpeg',
        });
        formData.append('device_asset_id', assets[0].resolvedAssetId);
    } else {
        assets.forEach((photo, index) => {
            formData.append('images', {
                uri: photo.uri,
                name: `photo_${index}.jpg`,
                type: 'image/jpeg',
            });
            formData.append('device_asset_id', photo.resolvedAssetId);
        });
    }

    const api = assets.length === 1 ? `${API_URL}/api/photo` : `${API_URL}/api/photos/batch`;

    const response = await fetch(api, {
        method: 'POST',
        body: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        },
    });

    const data = await response.json();

    if (response.status === 409 || data?.error === 'Duplicate image') {
        return { duplicate: true, error: data.error || 'Duplicate image' };
    }

    if (!response.ok) {
        throw new Error(normalizeApiError(data, 'Failed to process photos'));
    }

    return data;

/* wait
    if (response.status === 409 || data.error === 'Duplicate image') {
        return { added: [], duplicates: assets.length };
    }

    if (!response.ok) {
        console.error('processPhotos error:', data);
        return { added: [], duplicates: 0 };
    }

    if (assets.length === 1) {
        return {
            added: [{ id: data.photo?.id, uri: assets[0].uri }],
            duplicates: 0
        };
    }
    const successfulResults = data.results || [];
    const added = successfulResults.map(r => ({
        id: r.photo?.id,
        device_asset_id: assets[r.index].resolvedAssetId,
        uri: assets[r.index].resolvedUri,
        uri: assets[r.index].uri,
    }));
    return { added, duplicates: assets.length - added.length };
*/
};

export const getAllPhotos = async () => {
    try {
        const token = await getSession();

        const response = await fetch(`${API_URL}/api/photos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        const data = await response.json();

        if (response.ok) {
            return data.result || [];
        } else {
            throw new Error(normalizeApiError(data, 'Failed to load photos'));
        }
    } catch (error) {
        console.log("getAllPhotos Service Error:", error);
        throw error;
    }
};

export const searchPhoto = async (query = '') => {
    try {
        const token = await getSession();

        const response = await fetch(`${API_URL}/api/photos/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query }),
        });

        const data = await response.json();

        if (response.ok) {
            return data.results || [];
        } else {
            throw new Error(normalizeApiError(data, 'Failed to search photos'));
        }
    } catch (error) {
        console.log("searchPhoto Service Error:", error);
        throw error;
    }
};

export const deletePhoto = async (photoId) => {
  if (!photoId) 
    throw new Error('Photo ID is required');

  const token = await getSession();
  const response = await fetch(`${API_URL}/api/photo/${photoId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(normalizeApiError(data, 'Failed to delete photo'));
  }

  return data;
}

export const updatePhotoDescriptions = async ({ photoId, literal, descriptive }) => {
  if (!photoId)
    throw new Error('Photo ID is required');

  const token = await getSession();
  const response = await fetch(`${API_URL}/api/photo/${photoId}/descriptions`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ literal, descriptive }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(normalizeApiError(data, 'Failed to update descriptions'));
  }

  return data.photo;
};

export const updatePhotoPreferences = async ({
  photoId,
  isFavorite,
  isArchived,
  isHidden,
}) => {
  if (!photoId)
    throw new Error('Photo ID is required');

  const token = await getSession();
  const response = await fetch(`${API_URL}/api/photo/${photoId}/preferences`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      is_favorite: isFavorite,
      is_archived: isArchived,
      is_hidden: isHidden,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(normalizeApiError(data, 'Failed to update photo preferences'));
  }

  return data.photo;
};
