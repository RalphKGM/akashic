import { useEffect, useRef, useCallback, useState } from 'react';
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
import { usePhotoContext } from '../../context/PhotoContext.jsx';
import { useThemeContext } from '../../context/ThemeContext.jsx';
import { getThemeColors } from '../../theme/appColors.js';
import { useLibraryPhotoLoader } from '../../hooks/useLibraryPhotoLoader.js';
import { useLibrarySearch } from '../../hooks/useLibrarySearch.js';
import { useLibraryPhotoActions } from '../../hooks/useLibraryPhotoActions.js';

const numColumns = 4;

export default function Library() {
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    mediaTypes: 'photo',
  });
  const { photos, setPhotos, uploadProgress } = usePhotoContext();
  const { isDarkMode } = useThemeContext();
  const router = useRouter();
  const flatListRef = useRef(null);

  const {
    isSearching,
    searchQuery,
    setSearchQuery,
    searchLoading,
    searchError,
    filteredPhotos,
    setFilteredPhotos,
    handleSearch,
    toggleSearch,
    titleOpacity,
    searchWidth,
    searchOpacity,
  } = useLibrarySearch();

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
  } = useLibraryPhotoActions({
    photos,
    filteredPhotos,
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

  // scroll to bottom only when new photos are uploaded (not on initial load)
  const prevPhotoCountRef = useRef(0);
  useEffect(() => {
    const isNewUpload = photos.length > prevPhotoCountRef.current && prevPhotoCountRef.current > 0;
    prevPhotoCountRef.current = photos.length;
    if (isNewUpload) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [photos.length]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session) handleGetPhotos();
    });
    return () => { mounted = false; };
  }, [handleGetPhotos]);

  const renderPhotoItem = useCallback(
    ({ item }) => (
      <PhotoItem
        numColumns={numColumns}
        onPress={handlePressPhoto}
        onLongPress={handleLongPressPhoto}
        item={item}
        isSelected={selectedPhotoIds.includes(item.id)}
        selectionMode={isSelectionMode}
      />
    ),
    [handlePressPhoto, handleLongPressPhoto, selectedPhotoIds, isSelectionMode]
  );

  const uploadPct = uploadProgress
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0;

  const colors = getThemeColors(isDarkMode);

  const bannerBg = isDarkMode ? '#1C1C1E' : '#F5F5F5';
  const bannerTrackBg = isDarkMode ? '#3A3A3C' : '#D4D4D8';
  const bannerSpinnerColor = isDarkMode ? '#A1A1AA' : '#52525B';
  const bannerTextColor = isDarkMode ? '#E4E4E7' : '#52525B';
  const bannerSubTextColor = isDarkMode ? '#71717A' : '#737373';

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
          <Text className={`text-xs mt-0.5 ${colors.count}`}>
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </Text>
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
            data={photos}
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
                data={filteredPhotos}
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
        isDeleting={isDeletingPhoto}
      />
    </View>
  );
}