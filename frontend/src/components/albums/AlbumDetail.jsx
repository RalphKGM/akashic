import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  StatusBar,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { deletePhoto } from '../../service/photoService.js';
import { removePhotoFromCache } from '../../service/cacheService.js';
import { useThemeContext } from '../../context/ThemeContext.jsx';
import { getThemeColors } from '../../theme/appColors.js';
import PhotoViewer from '../../components/PhotoViewer.jsx';
import PhotoItem from '../../components/PhotoItem.jsx';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 4;

export default function AlbumDetail({
  album,
  onBack,
  onPhotosChange,
  onAddPhotos,
  canAddPhotos,
  onRemovePhotos,
  onOpenMenu,
}) {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useThemeContext();
  const colors = getThemeColors(isDarkMode);
  const isCategoryAlbum = Boolean(album?.isCategory);
  const orderedPhotos = useMemo(() => {
    if (!Array.isArray(album?.photo_ids) || album.photo_ids.length === 0) {
      return album.photos || [];
    }

    const orderMap = new Map(
      album.photo_ids.map((id, index) => [id, index])
    );
    return (album.photos || [])
      .slice()
      .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  }, [album?.photo_ids, album?.photos]);

  const [photos, setPhotos] = useState(orderedPhotos);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [isRemovingSelectedPhotos, setIsRemovingSelectedPhotos] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setPhotos(orderedPhotos);
    setSelectedIndex(null);
  }, [album?.id, orderedPhotos]);

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [40, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const selectedCount = selectedPhotoIds.length;

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

  const handlePressPhoto = useCallback((item) => {
    if (isSelectionMode) {
      toggleSelectedPhoto(item.item.id);
      return;
    }

    const index = photos.findIndex(
      p => p.id === item.item.id
    );
    if (index !== -1) setSelectedIndex(index);
  }, [isSelectionMode, photos, toggleSelectedPhoto]);

  const handleLongPressPhoto = useCallback((item) => {
    const photoId = item?.item?.id;
    if (!photoId) return;

    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedPhotoIds([photoId]);
      setSelectedIndex(null);
      return;
    }

    toggleSelectedPhoto(photoId);
  }, [isSelectionMode, toggleSelectedPhoto]);

  const handleDeletePhoto = useCallback(async () => {
    if (selectedIndex === null || isDeletingPhoto) return;
    const photo = photos[selectedIndex];
    if (!photo?.id) return;

    try {
      setIsDeletingPhoto(true);
      await deletePhoto(photo.id);
      await removePhotoFromCache(photo.id);
      const updated = photos.filter(p => p.id !== photo.id);
      setPhotos(updated);
      onPhotosChange(updated, [photo.id]);
      setSelectedIndex(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeletingPhoto(false);
    }
  }, [selectedIndex, isDeletingPhoto, photos, onPhotosChange]);

  const handleRemoveSelectedPhotos = useCallback(() => {
    if (selectedCount === 0 || isRemovingSelectedPhotos) return;

    Alert.alert(
      'Remove from album',
      `Remove ${selectedCount} ${selectedCount === 1 ? 'photo' : 'photos'} from this album?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              setIsRemovingSelectedPhotos(true);
              await onRemovePhotos(selectedPhotoIds);
              clearSelection();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to remove selected photos');
            } finally {
              setIsRemovingSelectedPhotos(false);
            }
          },
        },
      ]
    );
  }, [
    selectedCount,
    isRemovingSelectedPhotos,
    selectedPhotoIds,
    onRemovePhotos,
    clearSelection,
  ]);

  const viewerPhotos = photos.map(p => ({ item: p, uri: p.uri ?? null }));

  const renderItem = useCallback(
    ({ item }) => (
      <PhotoItem
        localUri={item.uri ?? null}
        numColumns={GRID_COLUMNS}
        onPress={handlePressPhoto}
        onLongPress={handleLongPressPhoto}
        item={item}
        isSelected={selectedPhotoIds.includes(item.id)}
        selectionMode={isSelectionMode}
      />
    ),
    [handleLongPressPhoto, handlePressPhoto, isSelectionMode, selectedPhotoIds]
  );

  return (
    <View className={`flex-1 ${colors.pageBg}`} style={{ paddingTop: insets.top }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Nav bar */}
      {isSelectionMode ? (
        <View className="h-11 flex-row items-center justify-between px-4">
          <Pressable onPress={clearSelection} className="py-1 pr-3">
            <Text className={`text-base ${colors.text}`}>Cancel</Text>
          </Pressable>

          <Text className={`text-[17px] font-semibold text-center ${colors.text}`}>
            {selectedCount} selected
          </Text>

          <Pressable
            onPress={handleRemoveSelectedPhotos}
            disabled={selectedCount === 0 || isRemovingSelectedPhotos}
            className="py-1 pl-3"
            style={{ opacity: selectedCount === 0 || isRemovingSelectedPhotos ? 0.4 : 1 }}
          >
            {isRemovingSelectedPhotos ? (
              <ActivityIndicator size="small" color={colors.icon} />
            ) : (
              <Text className="text-base font-semibold text-blue-500">Remove</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View className="h-11 flex-row items-center justify-between px-2">
          <Pressable onPress={onBack} hitSlop={12} className="flex-row items-center w-[70px]">
            <Ionicons name="chevron-back" size={22} color={colors.icon} />
            <Text className={`text-[17px] ${colors.text}`}>Albums</Text>
          </Pressable>

          <Animated.Text
            className={`text-[17px] font-semibold text-center ${colors.text}`}
            style={{ opacity: headerTitleOpacity }}
          >
            {album.name}
          </Animated.Text>

          <View className="w-[90px] flex-row items-center justify-end">
            {!isCategoryAlbum && (
              <>
                <Pressable
                  onPress={onAddPhotos}
                  disabled={!canAddPhotos}
                  hitSlop={12}
                  className="px-1"
                  style={{ opacity: canAddPhotos ? 1 : 0.4 }}
                >
                  <Ionicons name="add" size={26} color={canAddPhotos ? colors.icon : '#9CA3AF'} />
                </Pressable>
                <Pressable onPress={onOpenMenu} hitSlop={12} className="px-1">
                  <Ionicons name="ellipsis-horizontal" size={22} color={colors.icon} />
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}

      {/* Scrollable grid */}
      <Animated.FlatList
        data={photos}
        numColumns={GRID_COLUMNS}
        keyExtractor={item => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="px-4 pt-2 pb-3">
            <Animated.Text
              className={`text-[34px] font-bold tracking-tight ${colors.text}`}
              style={{ opacity: largeTitleOpacity }}
            >
              {album.name}
            </Animated.Text>
            <Text className={`text-[13px] mt-0.5 ${colors.subtext}`}>
              {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
            </Text>
          </View>
        }
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 1.5 }} />}
        columnWrapperStyle={{ gap: 1.5 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      />

      <PhotoViewer
        visible={selectedIndex !== null}
        photos={viewerPhotos}
        initialIndex={selectedIndex ?? 0}
        onClose={() => setSelectedIndex(null)}
        onDelete={handleDeletePhoto}
        isDeleting={isDeletingPhoto}
      />
    </View>
  );
}

