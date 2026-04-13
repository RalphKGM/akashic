import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  Pressable,
  TextInput,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { supabase } from '../../config/supabase.js';
import PhotoItem from '../../components/PhotoItem.jsx';
import PhotoViewer from '../../components/PhotoViewer.jsx';
import { usePhotoContext } from '../../context/PhotoContext';
import { useThemeContext } from '../../context/ThemeContext.jsx';
import { getThemeColors } from '../../theme/appColors.js';
import { useLibraryPhotoLoader } from '../../hooks/useLibraryPhotoLoader.js';
import { useLibrarySearch } from '../../hooks/useLibrarySearch.js';
import { useLibraryPhotoActions } from '../../hooks/useLibraryPhotoActions.js';
import { getKnownFaces } from '../../service/faceService.js';

const numColumns = 4;
const FILTER_OPTIONS = [
  { value: 'library', label: 'Library', hint: 'Default view' },
  { value: 'favorites', label: 'Favorites', hint: 'Only hearted photos' },
  { value: 'archived', label: 'Archived', hint: 'Hidden from Library, still saved' },
  { value: 'hidden', label: 'Hidden', hint: 'Private from normal browsing' },
  { value: 'all', label: 'All', hint: 'Every photo, including archived and hidden' },
];
const DATE_FILTER_OPTIONS = [
  { value: 'anytime', label: 'Anytime' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
];

const matchesPhotoFilter = (photo, filter) => {
  if (!photo) return false;

  switch (filter) {
    case 'favorites':
      return Boolean(photo.is_favorite) && !photo.is_hidden;
    case 'archived':
      return Boolean(photo.is_archived) && !photo.is_hidden;
    case 'hidden':
      return Boolean(photo.is_hidden);
    case 'all':
      return true;
    case 'library':
    default:
      return !photo.is_archived && !photo.is_hidden;
  }
};

const matchesDateFilter = (photo, filter) => {
  if (!photo?.created_at || filter === 'anytime') return true;

  const createdAt = new Date(photo.created_at);
  if (Number.isNaN(createdAt.getTime())) return true;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case 'today':
      return createdAt >= startOfToday;
    case 'week': {
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 6);
      return createdAt >= startOfWeek;
    }
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return createdAt >= startOfMonth;
    }
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return createdAt >= startOfYear;
    }
    default:
      return true;
  }
};

export default function Library() {
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    mediaTypes: 'photo',
  });
  const { photos, setPhotos, uploadProgress } = usePhotoContext();
  const { isDarkMode } = useThemeContext();
  const router = useRouter();
  const flatListRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('library');
  const [activeDateFilter, setActiveDateFilter] = useState('anytime');
  const [openFilterMenu, setOpenFilterMenu] = useState(null);
  const [knownFaces, setKnownFaces] = useState([]);

  const {
    isSearching,
    searchQuery,
    setSearchQuery,
    searchLoading,
    searchError,
    filteredPhotos,
    setFilteredPhotos,
    handleSearch,
    openSearchWithQuery,
    toggleSearch,
    titleOpacity,
    searchWidth,
    searchOpacity,
  } = useLibrarySearch();

  const displayPhotos = useMemo(
    () => photos.filter((photo) => matchesPhotoFilter(photo, activeFilter) && matchesDateFilter(photo, activeDateFilter)),
    [photos, activeFilter, activeDateFilter]
  );

  const displayFilteredPhotos = useMemo(() => {
    if (filteredPhotos === null) return null;

    return filteredPhotos.filter(
      (photo) => matchesPhotoFilter(photo, activeFilter) && matchesDateFilter(photo, activeDateFilter)
    );
  }, [filteredPhotos, activeFilter, activeDateFilter]);

  const {
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
  } = useLibraryPhotoActions({
    photos,
    filteredPhotos,
    displayPhotos,
    displayFilteredPhotos,
    setPhotos,
    setFilteredPhotos,
  });

  const { isLoading, handleGetPhotos } = useLibraryPhotoLoader({
    permissionResponse,
    requestPermission,
    setPhotos,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await handleGetPhotos({ forceRefresh: true });
    } finally {
      setIsRefreshing(false);
    }
  }, [handleGetPhotos]);

  const handlePhotoResolvedUri = useCallback((photoId, uri) => {
    if (!photoId || !uri) return;

    setPhotos((prev) => {
      let changed = false;
      const next = prev.map((photo) => {
        if (photo.id !== photoId || photo.uri === uri) return photo;
        changed = true;
        return { ...photo, uri };
      });
      return changed ? next : prev;
    });

    setFilteredPhotos((prev) => {
      if (!Array.isArray(prev)) return prev;

      let changed = false;
      const next = prev.map((photo) => {
        if (photo.id !== photoId || photo.uri === uri) return photo;
        changed = true;
        return { ...photo, uri };
      });
      return changed ? next : prev;
    });
  }, [setFilteredPhotos, setPhotos]);

  // scroll to bottom only when new photos are uploaded (not on initial load)
  const prevPhotoCountRef = useRef(0);
  useEffect(() => {
    const isNewUpload =
      displayPhotos.length > prevPhotoCountRef.current && prevPhotoCountRef.current > 0;
    prevPhotoCountRef.current = displayPhotos.length;
    if (isNewUpload) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [displayPhotos.length]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session) handleGetPhotos();
    });
    return () => { mounted = false; };
  }, [handleGetPhotos]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active || !session) return;

      try {
        const faces = await getKnownFaces();
        if (active) {
          setKnownFaces(faces || []);
        }
      } catch {
        if (active) {
          setKnownFaces([]);
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const renderPhotoItem = useCallback(
    ({ item }) => (
      <PhotoItem
        numColumns={numColumns}
        onPress={handlePressPhoto}
        onLongPress={handleLongPressPhoto}
        item={item}
        isSelected={selectedPhotoIds.includes(item.id)}
        selectionMode={isSelectionMode}
        onResolvedUri={handlePhotoResolvedUri}
      />
    ),
    [handlePhotoResolvedUri, handlePressPhoto, handleLongPressPhoto, selectedPhotoIds, isSelectionMode]
  );

  const uploadPct = uploadProgress
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0;

  const colors = getThemeColors(isDarkMode);
  const activeFilterOption = FILTER_OPTIONS.find((option) => option.value === activeFilter) ?? FILTER_OPTIONS[0];
  const activeDateOption =
    DATE_FILTER_OPTIONS.find((option) => option.value === activeDateFilter) ?? DATE_FILTER_OPTIONS[0];

  const bannerBg = isDarkMode ? '#1C1C1E' : '#F5F5F5';
  const bannerTrackBg = isDarkMode ? '#3A3A3C' : '#D4D4D8';
  const bannerSpinnerColor = isDarkMode ? '#A1A1AA' : '#52525B';
  const bannerTextColor = isDarkMode ? '#E4E4E7' : '#52525B';
  const bannerSubTextColor = isDarkMode ? '#71717A' : '#737373';

  const handleUpdatePreferencesFromViewer = useCallback(
    async (payload) => {
      const updated = await handleUpdatePhotoPreferences(payload);
      if (
        updated &&
        (!matchesPhotoFilter(updated, activeFilter) || !matchesDateFilter(updated, activeDateFilter))
      ) {
        setSelectedIndex(null);
      }
      return updated;
    },
    [activeDateFilter, activeFilter, handleUpdatePhotoPreferences, setSelectedIndex]
  );

  return (
    <View className={`flex-1 ${colors.pageBg}`}>
      <View className={`${colors.headerBg} pt-16 pb-3 px-4 border-b ${colors.border}`}>
        {isSelectionMode ? (
          <View className="flex-row items-center justify-between">
            <Pressable onPress={clearSelection} className="py-1 pr-3">
              <Text className={`text-base ${colors.title}`}>Cancel</Text>
            </Pressable>
            <Text className={`text-lg font-semibold ${colors.title}`}>
              {selectedCount} selected
            </Text>
            <Pressable
              onPress={handleDeleteSelectedPhotos}
              disabled={selectedCount === 0 || isDeletingSelectedPhotos}
              className="py-1 pl-3"
              style={{ opacity: selectedCount === 0 || isDeletingSelectedPhotos ? 0.4 : 1 }}
            >
              {isDeletingSelectedPhotos ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Text className="text-base font-semibold text-red-500">Delete</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <Animated.Text
              style={{ opacity: titleOpacity, position: isSearching ? 'absolute' : 'relative' }}
              className={`text-3xl font-extrabold tracking-tight ${colors.title}`}
            >
              Photos
            </Animated.Text>

            {isSearching && (
              <Animated.View style={{ width: searchWidth, opacity: searchOpacity }}>
                <TextInput
                  placeholder="Search your photos..."
                  placeholderTextColor={colors.inputPlaceholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  autoFocus
                  className={`${colors.inputBg} rounded-xl px-4 py-2 ${colors.inputText} text-base`}
                  style={{ height: 40 }}
                  editable={!searchLoading}
                />
              </Animated.View>
            )}

            <View className="flex-row items-center pt-2 gap-4">
              {!isSearching ? (
                <>
                  <Pressable onPress={handleRefresh} disabled={isRefreshing}>
                    <Ionicons
                      name="refresh"
                      size={23}
                      color={colors.icon}
                      style={{ opacity: isRefreshing ? 0.4 : 1 }}
                    />
                  </Pressable>
                  <Pressable onPress={() => toggleSearch(isSelectionMode)}>
                    <Ionicons name="search" size={25} color={colors.icon} />
                  </Pressable>
                </>
              ) : (
                <Pressable onPress={() => toggleSearch(isSelectionMode)} className="px-1 py-1">
                  <Text className={`text-base font-medium ${colors.title}`}>Cancel</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {!isSearching && !isSelectionMode && (
          <>
            <Text className={`text-xs mt-0.5 ${colors.count}`}>
              {displayPhotos.length} {displayPhotos.length === 1 ? 'photo' : 'photos'}
            </Text>
            <View className="flex-row gap-2 mt-3">
              <Pressable
                onPress={() => setOpenFilterMenu((prev) => (prev === 'status' ? null : 'status'))}
                className={`flex-1 flex-row items-center justify-between rounded-xl px-3 py-2 ${
                  isDarkMode ? 'bg-zinc-700' : 'bg-gray-100'
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons name="options-outline" size={16} color={colors.icon} />
                  <Text className={`ml-2 text-sm font-semibold ${colors.title}`}>{activeFilterOption.label}</Text>
                </View>
                <Ionicons
                  name={openFilterMenu === 'status' ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.icon}
                />
              </Pressable>
              <Pressable
                onPress={() => setOpenFilterMenu((prev) => (prev === 'date' ? null : 'date'))}
                className={`flex-1 flex-row items-center justify-between rounded-xl px-3 py-2 ${
                  isDarkMode ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200'
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={16} color={colors.icon} />
                  <Text className={`ml-2 text-sm font-semibold ${colors.title}`}>{activeDateOption.label}</Text>
                </View>
                <Ionicons
                  name={openFilterMenu === 'date' ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.icon}
                />
              </Pressable>
            </View>
            {openFilterMenu === 'status' && (
              <View className={`mt-2 rounded-2xl border px-2 py-2 ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
                {FILTER_OPTIONS.map((option) => {
                  const isActive = activeFilter === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setActiveFilter(option.value);
                        setOpenFilterMenu(null);
                      }}
                      className={`rounded-xl px-3 py-3 ${isActive ? (isDarkMode ? 'bg-zinc-700' : 'bg-gray-100') : ''}`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-3">
                          <Text className={`text-sm font-semibold ${colors.title}`}>{option.label}</Text>
                          <Text className={`text-xs mt-0.5 ${colors.textSecondary}`}>{option.hint}</Text>
                        </View>
                        {isActive && <Ionicons name="checkmark" size={18} color={colors.icon} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {openFilterMenu === 'date' && (
              <View className={`mt-2 rounded-2xl border px-2 py-2 ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
                {DATE_FILTER_OPTIONS.map((option) => {
                  const isActive = activeDateFilter === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setActiveDateFilter(option.value);
                        setOpenFilterMenu(null);
                      }}
                      className={`rounded-xl px-3 py-3 ${isActive ? (isDarkMode ? 'bg-zinc-700' : 'bg-gray-100') : ''}`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className={`text-sm font-semibold ${colors.title}`}>{option.label}</Text>
                        {isActive && <Ionicons name="checkmark" size={18} color={colors.icon} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {knownFaces.length > 0 && (
              <View className="mt-3">
                <Text className={`text-xs mb-2 ${colors.count}`}>People</Text>
                <View className="flex-row flex-wrap gap-2">
                  {knownFaces.slice(0, 8).map((face) => (
                    <Pressable
                      key={face.id}
                      onPress={() => openSearchWithQuery(`photos with ${face.name}`)}
                      className={`px-3 py-1.5 rounded-full ${colors.tagBg}`}
                    >
                      <Text className={`${colors.tagText} text-xs font-semibold`}>
                        {face.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {uploadProgress && !isSelectionMode && (
        <Pressable
          onPress={() => router.push('/upload')}
          style={{ backgroundColor: bannerBg }}
          className="mx-3 mt-2 mb-1 rounded-2xl px-4 py-3 active:opacity-70"
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              {uploadProgress.done ? (
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              ) : (
                <ActivityIndicator size="small" color={bannerSpinnerColor} />
              )}
              <Text
                style={{ color: uploadProgress.done ? '#22C55E' : bannerTextColor }}
                className="font-semibold text-sm ml-2"
              >
                {uploadProgress.done
                  ? `${uploadProgress.total} photo${uploadProgress.total !== 1 ? 's' : ''} added`
                  : `Uploading... ${uploadProgress.current}/${uploadProgress.total}`}
              </Text>
            </View>
            <Text style={{ color: bannerSubTextColor }} className="text-xs">
              Tap to view
            </Text>
          </View>

          <View
            style={{ backgroundColor: bannerTrackBg }}
            className="h-1.5 rounded-full overflow-hidden"
          >
            <View
              className={`h-full rounded-full ${uploadProgress.done ? 'bg-[#22C55E]' : ''}`}
              style={{
                width: `${uploadPct}%`,
                backgroundColor: uploadProgress.done ? '#22C55E' : bannerSpinnerColor,
              }}
            />
          </View>
        </Pressable>
      )}

      <View className="flex-1 relative">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.loading} />
            <Text className={`mt-3 text-base ${colors.loadingText}`}>Loading photos...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayPhotos}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 2.5, paddingTop: 2, paddingBottom: 200 }}
            showsVerticalScrollIndicator={false}
            renderItem={renderPhotoItem}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}
        {isSearching && !isSelectionMode && (
          <View className={`absolute inset-0 ${colors.pageBg}`}>
            {searchLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={colors.loading} />
                <Text className={`mt-3 text-base ${colors.loadingText}`}>Searching...</Text>
              </View>
            ) : searchError ? (
              <View className="flex-1 items-center justify-center px-6">
                <Text className={`text-base text-center ${colors.loadingText}`}>{searchError}</Text>
              </View>
            ) : filteredPhotos !== null ? (
              <FlatList
                data={displayFilteredPhotos}
                numColumns={numColumns}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{
                  paddingHorizontal: 2.5,
                  paddingTop: 2,
                  paddingBottom: 200,
                }}
                showsVerticalScrollIndicator={false}
                renderItem={renderPhotoItem}
              />
            ) : null}
          </View>
        )}
      </View>

      <PhotoViewer
        visible={selectedIndex !== null}
        photos={viewerPhotos}
        initialIndex={selectedIndex ?? 0}
        onClose={() => setSelectedIndex(null)}
        onDelete={handleDeleteSelectedPhoto}
        onSaveDescriptions={handleSaveDescriptions}
        onUpdatePreferences={handleUpdatePreferencesFromViewer}
        isDeleting={isDeletingPhoto}
      />
    </View>
  );
}
