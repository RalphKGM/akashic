import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

const assetUriCache = new Map();

const getFallbackUri = (assetId) => {
  if (!assetId) return null;
  if (Platform.OS === 'ios') return `ph://${assetId}`;
  return null;
};

export const getResolvedPhotoUri = async (photo) => {
  if (photo?.uri) return photo.uri;

  const assetId = photo?.device_asset_id;
  if (!assetId) return null;

  if (assetUriCache.has(assetId)) {
    return assetUriCache.get(assetId);
  }

  const fallbackUri = getFallbackUri(assetId);
  if (fallbackUri) {
    assetUriCache.set(assetId, fallbackUri);
    return fallbackUri;
  }

  try {
    const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);
    const resolvedUri = assetInfo?.localUri || assetInfo?.uri || null;

    if (resolvedUri) {
      assetUriCache.set(assetId, resolvedUri);
      return resolvedUri;
    }
  } catch (error) {
    console.log('getResolvedPhotoUri failed:', error?.message);
  }

  return null;
};

export const useResolvedPhotoUri = (photo) => {
  const [resolvedUri, setResolvedUri] = useState(() => photo?.uri || getFallbackUri(photo?.device_asset_id));

  useEffect(() => {
    let active = true;

    const resolve = async () => {
      const nextUri = await getResolvedPhotoUri(photo);
      if (active) {
        setResolvedUri(nextUri);
      }
    };

    resolve();

    return () => {
      active = false;
    };
  }, [photo?.uri, photo?.device_asset_id]);

  return resolvedUri;
};
