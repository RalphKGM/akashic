import { useCallback, useState } from 'react';
import { getAllPhotos } from '../service/photoService.js';
import { getCachedPhotos, setCachedPhotos } from '../service/cacheService.js';

export const useLibraryPhotoLoader = ({ permissionResponse, requestPermission, setPhotos }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetPhotos = useCallback(async ({ forceRefresh = false } = {}) => {
    const t0 = Date.now();

    if (permissionResponse?.status !== 'granted') {
      const { status } = await requestPermission();
      if (status !== 'granted') return;
    }

    // check cache first (skip if forceRefresh)
    const t1 = Date.now();
    const cached = forceRefresh ? null : await getCachedPhotos();
    console.log(`[1] getCachedPhotos took ${Date.now() - t1}ms – ${cached?.length ?? 0} items`);

    if (cached && cached.length > 0) {
      // show photos from cache immediately
      const t2 = Date.now();
      const sortedCached = cached
        .filter((photo) => photo?.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setPhotos(sortedCached);
      console.log(`[2] setPhotos from cache took ${Date.now() - t2}ms – ${sortedCached.length} photos`);

      // verify if nasa db yung photos (photo_id)
      const t3 = Date.now();
      let dbPhotos = [];
      try {
        dbPhotos = await getAllPhotos();
      } catch (err) {
        console.log('[3] getAllPhotos sync failed, keeping cache:', err.message);
        console.log(`[TOTAL] handleGetPhotos (cache only) took ${Date.now() - t0}ms`);
        return;
      }
      console.log(`[3] getAllPhotos took ${Date.now() - t3}ms – ${dbPhotos?.length ?? 0} photos`);

      const dbPhotoIds = new Set(dbPhotos.map((p) => p.id));
      const cachedIds = new Set(cached.map((p) => p.id));

      const validCached = cached.filter((p) => dbPhotoIds.has(p.id));
      const missingFromCache = dbPhotos.filter((p) => !cachedIds.has(p.id));
      console.log(`[4] missing from cache: ${missingFromCache.length}`);

      // merge valid cached + missing photos (no URI resolution needed)
      const merged = [...validCached, ...missingFromCache]
        .filter((photo) => photo?.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setPhotos(merged);

      const t4 = Date.now();
      await setCachedPhotos(merged);
      console.log(`[5] setCachedPhotos took ${Date.now() - t4}ms`);

      console.log(`[TOTAL] handleGetPhotos (cache hit) took ${Date.now() - t0}ms`);
      return;
    }

    // fallback to supabase (if no photos in cache)
    setIsLoading(true);
    try {
      const t5 = Date.now();
      const assets = await getAllPhotos();
      console.log(`[6] getAllPhotos (no cache) took ${Date.now() - t5}ms – ${assets?.length ?? 0} photos`);

      if (!Array.isArray(assets) || assets.length === 0) return;

      // no resolvePhotoUri needed – expo-image renders device_asset_id directly
      const sorted = assets
        .filter(Boolean)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setPhotos(sorted);

      const t6 = Date.now();
      await setCachedPhotos(sorted);
      console.log(`[7] setCachedPhotos took ${Date.now() - t6}ms`);

      console.log(`[TOTAL] handleGetPhotos (no cache) took ${Date.now() - t0}ms`);
    } finally {
      setIsLoading(false);
    }
  }, [permissionResponse?.status, requestPermission, setPhotos]);

  return {
    isLoading,
    handleGetPhotos,
  };
};