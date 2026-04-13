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
  const viewerPhotos = useMemo(
    () => sourcePhotos.map((photo) => ({ item: photo })),
    [sourcePhotos]
  );

  const clearSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedPhotoIds([]);
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
        setIsSelectionMode(true);
        setSelectedPhotoIds([item.id]);
        return;
      }
      toggleSelectedPhoto(item.id);
    },
    [isSelectionMode, toggleSelectedPhoto]
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
    async ({ photoId, isFavorite, isArchived, isHidden }) => {
      if (!photoId) throw new Error('Photo ID is required');

      const updated = await updatePhotoPreferences({
        photoId,
        isFavorite,
        isArchived,
        isHidden,
      });

      setPhotos((prev) =>
        prev.map((photo) => (photo.id === photoId ? { ...photo, ...updated } : photo))
      );

      if (filteredPhotos) {
        setFilteredPhotos((prev) =>
          prev.map((photo) => (photo.id === photoId ? { ...photo, ...updated } : photo))
        );
      }

      await addPhotoToCache(updated);
      return updated;
    },
    [filteredPhotos, setFilteredPhotos, setPhotos]
  );

  return {
    sourcePhotos,
    viewerPhotos,
    selectedIndex,
    setSelectedIndex,
    isDeletingPhoto,
    isSelectionMode,
    selectedPhotoIds,
    selectedCount,
    isDeletingSelectedPhotos,
    clearSelection,
    handlePressPhoto,
    handleLongPressPhoto,
    handleDeleteSelectedPhoto,
    handleDeleteSelectedPhotos,
    handleSaveDescriptions,
    handleUpdatePhotoPreferences,
  };
};
