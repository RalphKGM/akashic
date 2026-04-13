import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { deletePhoto, updatePhotoDescriptions, updatePhotoPreferences } from '../service/photoService.js';
import { addPhotoToCache, removePhotoFromCache } from '../service/cacheService.js';

export const useLibraryPhotoActions = ({
  photos,
  filteredPhotos,
  displayPhotos,
  displayFilteredPhotos,
  setPhotos,
  setFilteredPhotos,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [isDeletingSelectedPhotos, setIsDeletingSelectedPhotos] = useState(false);

  const sourcePhotos = displayFilteredPhotos ?? displayPhotos ?? photos;
  const selectedCount = selectedPhotoIds.length;
  const selectedPhotos = useMemo(
    () => photos.filter((photo) => selectedPhotoIds.includes(photo.id)),
    [photos, selectedPhotoIds]
  );
  const viewerPhotos = useMemo(
    () => sourcePhotos.map((photo) => ({ item: photo })),
    [sourcePhotos]
  );

  const patchPhotoCollections = useCallback((photoId, patch) => {
    let nextPhoto = null;

    setPhotos((prev) =>
      prev.map((photo) => {
        if (photo.id !== photoId) return photo;
        nextPhoto = { ...photo, ...patch };
        return nextPhoto;
      })
    );

    if (filteredPhotos) {
      setFilteredPhotos((prev) =>
        prev.map((photo) => (photo.id === photoId ? { ...photo, ...patch } : photo))
      );
    }

    return nextPhoto;
  }, [filteredPhotos, setFilteredPhotos, setPhotos]);

  const clearSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedPhotoIds([]);
  }, []);

  const beginSelectionMode = useCallback((photoId) => {
    if (!photoId) return;
    setIsSelectionMode(true);
    setSelectedPhotoIds((prev) => (prev.includes(photoId) ? prev : [photoId]));
  }, []);

  const toggleSelectedPhoto = useCallback((photoId) => {
    setSelectedPhotoIds((prev) => {
      if (prev.includes(photoId)) return prev.filter((id) => id !== photoId);
      return [...prev, photoId];
    });
  }, []);

  const handlePressPhoto = useCallback(
    ({ item }) => {
      if (isSelectionMode) {
        toggleSelectedPhoto(item.id);
        return;
      }

      const index = sourcePhotos.findIndex((p) => p.id === item.id);
      if (index !== -1) setSelectedIndex(index);
    },
    [isSelectionMode, sourcePhotos, toggleSelectedPhoto]
  );

  const handleLongPressPhoto = useCallback(
    ({ item }) => {
      if (!item?.id) return;
      if (!isSelectionMode) {
        beginSelectionMode(item.id);
        return;
      }
      toggleSelectedPhoto(item.id);
    },
    [beginSelectionMode, isSelectionMode, toggleSelectedPhoto]
  );

  const handleDeleteSelectedPhoto = useCallback(async () => {
    if (selectedIndex === null || isDeletingPhoto) return;

    const photo = sourcePhotos[selectedIndex];
    if (!photo?.id) return;

    try {
      setIsDeletingPhoto(true);
      const deletedPhotoId = photo.id;

      await deletePhoto(deletedPhotoId);
      setPhotos((prev) => prev.filter((p) => p.id !== deletedPhotoId));
      if (filteredPhotos) {
        setFilteredPhotos((prev) => prev.filter((p) => p.id !== deletedPhotoId));
      }
      setSelectedPhotoIds((prev) => prev.filter((id) => id !== deletedPhotoId));
      await removePhotoFromCache(deletedPhotoId);
      setSelectedIndex(null);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeletingPhoto(false);
    }
  }, [filteredPhotos, isDeletingPhoto, selectedIndex, setFilteredPhotos, setPhotos, sourcePhotos]);

  const handleDeletePhotoById = useCallback(
    async (photoId) => {
      if (!photoId) return;

      try {
        setIsDeletingPhoto(true);
        await deletePhoto(photoId);
        setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
        if (filteredPhotos) {
          setFilteredPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
        }
        setSelectedPhotoIds((prev) => prev.filter((id) => id !== photoId));
        await removePhotoFromCache(photoId);
        setSelectedIndex((prev) => {
          if (prev === null) return prev;
          const nextIndex = sourcePhotos.findIndex((photo) => photo.id !== photoId);
          return nextIndex === -1 ? null : Math.min(prev, nextIndex);
        });
      } finally {
        setIsDeletingPhoto(false);
      }
    },
    [filteredPhotos, setFilteredPhotos, setPhotos, sourcePhotos]
  );

  const handleDeleteSelectedPhotos = useCallback(() => {
    if (selectedCount === 0 || isDeletingSelectedPhotos) return;

    Alert.alert(
      'Delete selected photos',
      `Delete ${selectedCount} ${selectedCount === 1 ? 'photo' : 'photos'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingSelectedPhotos(true);
              const idsToDelete = [...selectedPhotoIds];
              const results = await Promise.allSettled(
                idsToDelete.map(async (photoId) => {
                  await deletePhoto(photoId);
                  await removePhotoFromCache(photoId);
                  return photoId;
                })
              );

              const deletedIds = results
                .filter((result) => result.status === 'fulfilled')
                .map((result) => result.value);

              if (deletedIds.length > 0) {
                const deletedSet = new Set(deletedIds);
                setPhotos((prev) => prev.filter((p) => !deletedSet.has(p.id)));
                if (filteredPhotos) {
                  setFilteredPhotos((prev) => prev.filter((p) => !deletedSet.has(p.id)));
                }
              }

              const failedCount = results.length - deletedIds.length;
              if (failedCount > 0) {
                Alert.alert('Delete incomplete', `${failedCount} photo(s) could not be deleted.`);
              }
              clearSelection();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete selected photos');
            } finally {
              setIsDeletingSelectedPhotos(false);
            }
          },
        },
      ]
    );
  }, [
    clearSelection,
    filteredPhotos,
    isDeletingSelectedPhotos,
    selectedCount,
    selectedPhotoIds,
    setFilteredPhotos,
    setPhotos,
  ]);

  const handleSaveDescriptions = useCallback(
    async ({ photoId, literal, descriptive }) => {
      if (!photoId) throw new Error('Photo ID is required');

      const updated = await updatePhotoDescriptions({ photoId, literal, descriptive });

      setPhotos((prev) =>
        prev.map((photo) => (photo.id === photoId ? { ...photo, ...updated } : photo))
      );

      if (filteredPhotos) {
        setFilteredPhotos((prev) =>
          prev.map((photo) => (photo.id === photoId ? { ...photo, ...updated } : photo))
        );
      }

      await addPhotoToCache(updated);
    },
    [filteredPhotos, setFilteredPhotos, setPhotos]
  );

  const handleUpdatePhotoPreferences = useCallback(
    async ({ photoId, isFavorite, isHidden }) => {
      if (!photoId) throw new Error('Photo ID is required');

      const currentPhoto =
        sourcePhotos.find((photo) => photo.id === photoId) ||
        photos.find((photo) => photo.id === photoId) ||
        filteredPhotos?.find((photo) => photo.id === photoId);

      if (!currentPhoto) {
        throw new Error('Photo not found');
      }

      const optimisticPatch = {
        is_favorite: typeof isFavorite === 'boolean' ? isFavorite : currentPhoto.is_favorite,
        is_hidden: typeof isHidden === 'boolean' ? isHidden : currentPhoto.is_hidden,
        updated_at: new Date().toISOString(),
      };

      patchPhotoCollections(photoId, optimisticPatch);

      try {
        const updated = await updatePhotoPreferences({
          photoId,
          isFavorite,
          isHidden,
        });

        patchPhotoCollections(photoId, updated);
        await addPhotoToCache(updated);
        return updated;
      } catch (error) {
        patchPhotoCollections(photoId, currentPhoto);
        throw error;
      }
    },
    [filteredPhotos, patchPhotoCollections, photos, sourcePhotos]
  );

  const handleUpdateSelectedPhotos = useCallback(
    async ({ isFavorite, isHidden }) => {
      if (selectedPhotoIds.length === 0) return;

      const snapshot = selectedPhotos.map((photo) => ({ ...photo }));
      const selectedSet = new Set(selectedPhotoIds);
      const optimisticTimestamp = new Date().toISOString();

      setPhotos((prev) =>
        prev.map((photo) => {
          if (!selectedSet.has(photo.id)) return photo;
          return {
            ...photo,
            is_favorite: typeof isFavorite === 'boolean' ? isFavorite : photo.is_favorite,
            is_hidden: typeof isHidden === 'boolean' ? isHidden : photo.is_hidden,
            updated_at: optimisticTimestamp,
          };
        })
      );

      if (filteredPhotos) {
        setFilteredPhotos((prev) =>
          prev.map((photo) => {
            if (!selectedSet.has(photo.id)) return photo;
            return {
              ...photo,
              is_favorite: typeof isFavorite === 'boolean' ? isFavorite : photo.is_favorite,
              is_hidden: typeof isHidden === 'boolean' ? isHidden : photo.is_hidden,
              updated_at: optimisticTimestamp,
            };
          })
        );
      }

      const results = await Promise.allSettled(
        selectedPhotos.map((photo) =>
          updatePhotoPreferences({
            photoId: photo.id,
            isFavorite: typeof isFavorite === 'boolean' ? isFavorite : photo.is_favorite,
            isHidden: typeof isHidden === 'boolean' ? isHidden : photo.is_hidden,
          })
        )
      );

      const successful = [];
      const failedIds = [];

      results.forEach((result, index) => {
        const photoId = selectedPhotos[index]?.id;
        if (!photoId) return;

        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failedIds.push(photoId);
        }
      });

      if (successful.length > 0) {
        const updatedById = new Map(successful.map((photo) => [photo.id, photo]));
        setPhotos((prev) => prev.map((photo) => updatedById.get(photo.id) || photo));
        if (filteredPhotos) {
          setFilteredPhotos((prev) => prev.map((photo) => updatedById.get(photo.id) || photo));
        }
        await addPhotoToCache(successful);
      }

      if (failedIds.length > 0) {
        const snapshotById = new Map(snapshot.map((photo) => [photo.id, photo]));
        const failedSet = new Set(failedIds);
        setPhotos((prev) =>
          prev.map((photo) => (failedSet.has(photo.id) ? snapshotById.get(photo.id) || photo : photo))
        );
        if (filteredPhotos) {
          setFilteredPhotos((prev) =>
            prev.map((photo) => (failedSet.has(photo.id) ? snapshotById.get(photo.id) || photo : photo))
          );
        }
        throw new Error(`Failed to update ${failedIds.length} selected photo(s)`);
      }
    },
    [filteredPhotos, selectedPhotoIds, selectedPhotos, setFilteredPhotos, setPhotos]
  );

  return {
    sourcePhotos,
    selectedPhotos,
    viewerPhotos,
    selectedIndex,
    setSelectedIndex,
    isDeletingPhoto,
    isSelectionMode,
    selectedPhotoIds,
    selectedCount,
    isDeletingSelectedPhotos,
    clearSelection,
    beginSelectionMode,
    handlePressPhoto,
    handleLongPressPhoto,
    handleDeleteSelectedPhoto,
    handleDeletePhotoById,
    handleDeleteSelectedPhotos,
    handleSaveDescriptions,
    handleUpdatePhotoPreferences,
    handleUpdateSelectedPhotos,
  };
};
