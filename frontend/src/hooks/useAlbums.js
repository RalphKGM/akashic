import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Dimensions, Animated, Alert } from 'react-native';
import {
  addPhotosToAlbum,
  createAlbum,
  deleteAlbum,
  getAlbums,
  removePhotosFromAlbum,
  renameAlbum,
} from '../service/albumService.js';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALBUMS_PER_PAGE = 4;

export default function useAlbums({ photos, setPhotos }) {
  const [openAlbum, setOpenAlbum] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateAlbumVisible, setIsCreateAlbumVisible] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [currentAlbumPage, setCurrentAlbumPage] = useState(0);
  const [isAddPhotosVisible, setIsAddPhotosVisible] = useState(false);
  const [selectedAddPhotoIds, setSelectedAddPhotoIds] = useState([]);
  const [isAddingPhotos, setIsAddingPhotos] = useState(false);
  const [isAlbumMenuVisible, setIsAlbumMenuVisible] = useState(false);
  const [isRenameVisible, setIsRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isRenamingAlbum, setIsRenamingAlbum] = useState(false);
  const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  const photoMap = useMemo(() => {
    const map = new Map();
    for (const photo of photos) {
      if (photo?.id) map.set(photo.id, photo);
    }
    return map;
  }, [photos]);

  const hydrateAlbums = useCallback(
    (rawAlbums) =>
      (rawAlbums || []).map((album) => {
        const albumPhotos = (album.photo_ids || [])
          .map((photoId) => photoMap.get(photoId))
          .filter(Boolean);
        const latestPhotoId = album.photo_ids?.[album.photo_ids.length - 1];
        const coverPhoto =
          (latestPhotoId && photoMap.get(latestPhotoId)) ||
          albumPhotos[albumPhotos.length - 1] ||
          null;

        return {
          ...album,
          photos: albumPhotos,
          coverPhoto,
        };
      }),
    [photoMap]
  );

  const loadAlbums = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);

        const result = await getAlbums();
        setAlbums(hydrateAlbums(result));
      } catch (error) {
        console.log('Load albums error:', error);
        setAlbums([]);
      } finally {
        if (refresh) setIsRefreshing(false);
        else setIsLoading(false);
      }
    },
    [hydrateAlbums]
  );

  useEffect(() => {
    loadAlbums();
  }, []);

  useEffect(() => {
    setAlbums((prev) => hydrateAlbums(prev));
  }, [photoMap, hydrateAlbums]);

  useEffect(() => {
    if (!openAlbum?.id) {
      setIsAddPhotosVisible(false);
      setSelectedAddPhotoIds([]);
      setIsAlbumMenuVisible(false);
      setIsRenameVisible(false);
    }
  }, [openAlbum?.id]);

  const albumPages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < albums.length; i += ALBUMS_PER_PAGE) {
      pages.push(albums.slice(i, i + ALBUMS_PER_PAGE));
    }
    return pages;
  }, [albums]);

  const handleOpenAlbum = useCallback(
    (album) => {
      setOpenAlbum(album);
      slideAnim.setValue(SCREEN_WIDTH);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 200,
        mass: 0.9,
      }).start();
    },
    [slideAnim]
  );

  const handleCloseAlbum = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setOpenAlbum(null));
  }, [slideAnim]);

  const handleAlbumPhotosChange = useCallback(
    (updatedPhotos, deletedPhotoIds = []) => {
      if (!openAlbum?.id) return;

      const deletedSet = new Set(deletedPhotoIds);
      if (deletedSet.size > 0) {
        setPhotos((prev) => prev.filter((photo) => !deletedSet.has(photo.id)));
      }

      const nextPhotoIds = updatedPhotos.map((photo) => photo.id);
      const nextCover = updatedPhotos[updatedPhotos.length - 1] ?? null;

      setAlbums((prev) =>
        prev.map((album) =>
          album.id === openAlbum.id
            ? {
                ...album,
                photos: updatedPhotos,
                photo_ids: nextPhotoIds,
                coverPhoto: nextCover,
                cover_photo_id: nextCover?.id ?? null,
              }
            : album
        )
      );

      setOpenAlbum((prev) =>
        prev && prev.id === openAlbum.id
          ? {
              ...prev,
              photos: updatedPhotos,
              photo_ids: nextPhotoIds,
              coverPhoto: nextCover,
              cover_photo_id: nextCover?.id ?? null,
            }
          : prev
      );
    },
    [openAlbum, setPhotos]
  );

  const openCreateAlbum = useCallback(() => {
    setSelectedPhotoIds([]);
    setNewAlbumName('');
    setIsCreateAlbumVisible(true);
  }, []);

  const closeCreateAlbum = useCallback(() => {
    if (isCreatingAlbum) return;
    setIsCreateAlbumVisible(false);
  }, [isCreatingAlbum]);

  const openAddPhotos = useCallback(() => {
    if (!openAlbum?.id) return;
    setSelectedAddPhotoIds([]);
    setIsAddPhotosVisible(true);
  }, [openAlbum?.id]);

  const closeAddPhotos = useCallback(() => {
    if (isAddingPhotos) return;
    setIsAddPhotosVisible(false);
  }, [isAddingPhotos]);

  const openAlbumMenu = useCallback(() => {
    if (!openAlbum?.id) return;
    setIsAlbumMenuVisible(true);
  }, [openAlbum?.id]);

  const closeAlbumMenu = useCallback(() => {
    if (isRenamingAlbum || isDeletingAlbum) return;
    setIsAlbumMenuVisible(false);
  }, [isRenamingAlbum, isDeletingAlbum]);

  const openRenameModal = useCallback(() => {
    if (!openAlbum?.id) return;
    setRenameValue(openAlbum.name || '');
    setIsAlbumMenuVisible(false);
    setIsRenameVisible(true);
  }, [openAlbum]);

  const closeRenameModal = useCallback(() => {
    if (isRenamingAlbum) return;
    setIsRenameVisible(false);
  }, [isRenamingAlbum]);

  const toggleSelectedPhoto = useCallback((photoId) => {
    setSelectedPhotoIds((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      }
      return [...prev, photoId];
    });
  }, []);

  const handleCreateAlbum = useCallback(async () => {
    const name = newAlbumName.trim();
    if (!name) {
      Alert.alert('Album name required', 'Please enter an album name.');
      return;
    }

    if (selectedPhotoIds.length === 0) {
      Alert.alert('Select photos', 'Please select at least one photo.');
      return;
    }

    try {
      setIsCreatingAlbum(true);
      const album = await createAlbum({
        name,
        coverPhotoId: selectedPhotoIds[selectedPhotoIds.length - 1],
      });
      await addPhotosToAlbum({ albumId: album.id, photoIds: selectedPhotoIds });
      setIsCreateAlbumVisible(false);
      setSelectedPhotoIds([]);
      setNewAlbumName('');
      await loadAlbums(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create album');
    } finally {
      setIsCreatingAlbum(false);
    }
  }, [newAlbumName, selectedPhotoIds, loadAlbums]);

  const availablePhotos = useMemo(() => {
    if (!openAlbum?.id) return [];
    const existingIds = new Set(openAlbum.photo_ids || openAlbum.photos?.map((p) => p.id) || []);
    return photos.filter((photo) => photo?.id && !existingIds.has(photo.id));
  }, [openAlbum, photos]);

  const toggleSelectedAddPhoto = useCallback((photoId) => {
    setSelectedAddPhotoIds((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      }
      return [...prev, photoId];
    });
  }, []);

  const handleAddPhotos = useCallback(async () => {
    if (!openAlbum?.id) return;
    if (selectedAddPhotoIds.length === 0) {
      Alert.alert('Select photos', 'Please select at least one photo.');
      return;
    }

    try {
      setIsAddingPhotos(true);
      await addPhotosToAlbum({ albumId: openAlbum.id, photoIds: selectedAddPhotoIds });
      const addedPhotos = selectedAddPhotoIds.map((id) => photoMap.get(id)).filter(Boolean);
      const updatedPhotos = [...(openAlbum.photos || []), ...addedPhotos];
      handleAlbumPhotosChange(updatedPhotos, []);
      setIsAddPhotosVisible(false);
      setSelectedAddPhotoIds([]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add photos');
    } finally {
      setIsAddingPhotos(false);
    }
  }, [openAlbum, selectedAddPhotoIds, photoMap, handleAlbumPhotosChange]);

  const handleRemoveFromAlbum = useCallback(
    async (photoIds) => {
      if (!openAlbum?.id) return;
      const idsToRemove = (photoIds || []).filter(Boolean);
      if (idsToRemove.length === 0) return;

      await removePhotosFromAlbum({ albumId: openAlbum.id, photoIds: idsToRemove });

      const removedSet = new Set(idsToRemove);
      const updatedPhotos = (openAlbum.photos || []).filter((photo) => !removedSet.has(photo.id));
      const nextPhotoIds = updatedPhotos.map((photo) => photo.id);
      const nextCover = updatedPhotos[updatedPhotos.length - 1] ?? null;

      setAlbums((prev) =>
        prev.map((album) =>
          album.id === openAlbum.id
            ? {
                ...album,
                photos: updatedPhotos,
                photo_ids: nextPhotoIds,
                coverPhoto: nextCover,
                cover_photo_id: nextCover?.id ?? null,
              }
            : album
        )
      );

      setOpenAlbum((prev) =>
        prev && prev.id === openAlbum.id
          ? {
              ...prev,
              photos: updatedPhotos,
              photo_ids: nextPhotoIds,
              coverPhoto: nextCover,
              cover_photo_id: nextCover?.id ?? null,
            }
          : prev
      );
    },
    [openAlbum]
  );

  const handleRenameAlbum = useCallback(async () => {
    if (!openAlbum?.id) return;
    const name = renameValue.trim();
    if (!name) {
      Alert.alert('Album name required', 'Please enter an album name.');
      return;
    }

    try {
      setIsRenamingAlbum(true);
      const updated = await renameAlbum({ albumId: openAlbum.id, name });

      setAlbums((prev) =>
        prev.map((album) =>
          album.id === openAlbum.id
            ? {
                ...album,
                name: updated.name,
              }
            : album
        )
      );

      setOpenAlbum((prev) =>
        prev && prev.id === openAlbum.id
          ? {
              ...prev,
              name: updated.name,
            }
          : prev
      );

      setIsRenameVisible(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to rename album');
    } finally {
      setIsRenamingAlbum(false);
    }
  }, [openAlbum, renameValue]);

  const handleDeleteAlbum = useCallback(() => {
    if (!openAlbum?.id) return;

    Alert.alert(
      'Delete album',
      'Delete this album? Photos will remain in your library.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingAlbum(true);
              await deleteAlbum({ albumId: openAlbum.id });
              setAlbums((prev) => prev.filter((album) => album.id !== openAlbum.id));
              setOpenAlbum(null);
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete album');
            } finally {
              setIsDeletingAlbum(false);
              setIsAlbumMenuVisible(false);
            }
          },
        },
      ]
    );
  }, [openAlbum]);

  return {
    screenWidth: SCREEN_WIDTH,
    slideAnim,
    albums,
    openAlbum,
    albumPages,
    isLoading,
    isRefreshing,
    currentAlbumPage,
    isCreateAlbumVisible,
    selectedPhotoIds,
    newAlbumName,
    isCreatingAlbum,
    isAddPhotosVisible,
    selectedAddPhotoIds,
    isAddingPhotos,
    isAlbumMenuVisible,
    isRenameVisible,
    renameValue,
    isRenamingAlbum,
    isDeletingAlbum,
    availablePhotos,
    loadAlbums,
    setCurrentAlbumPage,
    setNewAlbumName,
    setRenameValue,
    handleOpenAlbum,
    handleCloseAlbum,
    handleAlbumPhotosChange,
    openCreateAlbum,
    closeCreateAlbum,
    openAddPhotos,
    closeAddPhotos,
    openAlbumMenu,
    closeAlbumMenu,
    openRenameModal,
    closeRenameModal,
    toggleSelectedPhoto,
    toggleSelectedAddPhoto,
    handleCreateAlbum,
    handleAddPhotos,
    handleRemoveFromAlbum,
    handleRenameAlbum,
    handleDeleteAlbum,
  };
}
