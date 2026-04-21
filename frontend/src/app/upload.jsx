import { View, Text, Pressable, ScrollView, ActivityIndicator, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useMemo, useRef, useState } from 'react';
import { processSinglePhoto } from '../service/photoService';
import { usePhotoContext } from '../context/PhotoContext';
import { useThemeContext } from '../context/ThemeContext.jsx';
import { getThemeColors } from '../theme/appColors.js';
import { addPhotoToCache } from '../service/cacheService.js';
import { DEFAULT_UPLOAD_SETTINGS, getUploadSettings } from '../service/settingsService.js';

const RECENT_SCAN_LIMIT = 120;
const RECENT_SELECTION_LIMIT = 24;
const QUICK_PICK_LIMIT = 10;
const UPLOAD_CONCURRENCY = 3;

const getAssetKey = (asset) => asset?.assetId || asset?.id || asset?.uri || null;

const mergeAssets = (currentAssets, incomingAssets) => {
  const seen = new Set();
  const merged = [];

  [...currentAssets, ...incomingAssets].forEach((asset) => {
    const key = getAssetKey(asset);
    if (!key || seen.has(key) || !asset?.uri) return;
    seen.add(key);
    merged.push(asset);
  });

  return merged;
};

const isPhotoAsset = (asset) => {
  const mediaType = String(asset?.mediaType || '').toLowerCase();
  return !mediaType || mediaType === 'photo' || mediaType === 'image';
};

const prepareLibraryAsset = async (asset) => {
  try {
    const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
    const resolvedUri = assetInfo?.localUri || assetInfo?.uri || asset?.uri || null;

    if (!resolvedUri) return null;

    return {
      ...asset,
      assetId: asset.id,
      uri: resolvedUri,
      previewUri: asset?.uri || assetInfo?.uri || resolvedUri,
    };
  } catch (error) {
    console.log('prepareLibraryAsset failed:', error?.message);
    if (!asset?.uri) return null;

    return {
      ...asset,
      assetId: asset.id,
      previewUri: asset.uri,
    };
  }
};

export default function Upload() {
  const router = useRouter();
  const { appendPhoto, photos, uploadProgress, setUploadProgress } = usePhotoContext();
  const { themeId, isDarkMode } = useThemeContext();
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [recentSuggestions, setRecentSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [uploadSettings, setUploadSettings] = useState(DEFAULT_UPLOAD_SETTINGS);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const uploadedAssetIds = useMemo(
    () => new Set(photos.map((photo) => photo?.device_asset_id).filter(Boolean)),
    [photos]
  );

  useEffect(() => {
    if (!uploadProgress) return;
    const pct = uploadProgress.total > 0
      ? uploadProgress.current / uploadProgress.total
      : 0;
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progressAnim, uploadProgress?.current, uploadProgress?.total]);

  useEffect(() => {
    let active = true;

    getUploadSettings().then((settings) => {
      if (active) {
        setUploadSettings(settings);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadRecentSuggestions = async () => {
      if (!uploadSettings.showRecentSuggestions) {
        if (active) {
          setRecentSuggestions([]);
        }
        return;
      }

      setIsLoadingSuggestions(true);

      try {
        const permission = await MediaLibrary.getPermissionsAsync();
        const finalStatus =
          permission?.status === 'granted'
            ? permission.status
            : (await MediaLibrary.requestPermissionsAsync()).status;

        if (finalStatus !== 'granted') {
          if (active) {
            setRecentSuggestions([]);
          }
          return;
        }

        const page = await MediaLibrary.getAssetsAsync({
          first: RECENT_SCAN_LIMIT,
        });

        const candidates = page.assets
          .filter((asset) => asset?.id && isPhotoAsset(asset) && !uploadedAssetIds.has(asset.id))
          .slice(0, RECENT_SELECTION_LIMIT);

        const prepared = (await Promise.all(candidates.map((asset) => prepareLibraryAsset(asset))))
          .filter(Boolean);

        if (!active) return;

        setRecentSuggestions(prepared);

        if (uploadSettings.autoSelectRecentSuggestions) {
          setSelectedAssets((prev) =>
            prev.length > 0 ? prev : mergeAssets(prev, prepared)
          );
        }
      } catch (error) {
        console.log('loadRecentSuggestions failed:', error?.message);
        if (active) {
          setRecentSuggestions([]);
        }
      } finally {
        if (active) {
          setIsLoadingSuggestions(false);
        }
      }
    };

    loadRecentSuggestions();

    return () => {
      active = false;
    };
  }, [
    photos.length,
    uploadSettings.autoSelectRecentSuggestions,
    uploadSettings.showRecentSuggestions,
    uploadedAssetIds,
  ]);

  const handleSelectFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 50,
      quality: 1,
    });

    if (!result.canceled) {
      const newAssets = result.assets || [];
      setSelectedAssets((prev) => mergeAssets(prev, newAssets));
      setUploadSummary(null);
      setDuplicateWarning(null);
    }
  };

  const handleRefreshSuggestions = async () => {
    setRecentSuggestions([]);
    setIsLoadingSuggestions(true);

    try {
      const permission = await MediaLibrary.getPermissionsAsync();
      const finalStatus =
        permission?.status === 'granted'
          ? permission.status
          : (await MediaLibrary.requestPermissionsAsync()).status;

      if (finalStatus !== 'granted') {
        setRecentSuggestions([]);
        return;
      }

      const page = await MediaLibrary.getAssetsAsync({ first: RECENT_SCAN_LIMIT });
      const candidates = page.assets
        .filter((asset) => asset?.id && isPhotoAsset(asset) && !uploadedAssetIds.has(asset.id))
        .slice(0, RECENT_SELECTION_LIMIT);

      const prepared = (await Promise.all(candidates.map((asset) => prepareLibraryAsset(asset))))
        .filter(Boolean);

      setRecentSuggestions(prepared);
    } catch (error) {
      console.log('handleRefreshSuggestions failed:', error?.message);
      setRecentSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const addSuggestedAssets = (limit = recentSuggestions.length) => {
    setSelectedAssets((prev) => mergeAssets(prev, recentSuggestions.slice(0, limit)));
    setUploadSummary(null);
  };

  const removeSelected = (assetToRemove) => {
    const keyToRemove = getAssetKey(assetToRemove);
    setSelectedAssets((prev) => prev.filter((asset) => getAssetKey(asset) !== keyToRemove));
  };

  const uploadSelected = async () => {
    if (!selectedAssets || selectedAssets.length === 0) return;

    const total = selectedAssets.length;
    const duplicates = [];
    const failures = [];
    let completed = 0;
    let uploadedCount = 0;

    setDuplicateWarning(null);
    setUploadSummary(null);
    setUploadProgress({ current: 0, total, done: false, source: 'library-upload' });
    progressAnim.setValue(0);

    try {
      for (let i = 0; i < selectedAssets.length; i += UPLOAD_CONCURRENCY) {
        const chunk = selectedAssets.slice(i, i + UPLOAD_CONCURRENCY);
        const newPhotos = [];

        await Promise.allSettled(
          chunk.map(async (asset) => {
            try {
              const res = await processSinglePhoto(asset);
              if (res?.duplicate) {
                duplicates.push(asset);
                return;
              }

              if (res?.photo) {
                newPhotos.push(res.photo);
                uploadedCount += 1;
                return;
              }

              failures.push({
                asset,
                message: 'Photo processing did not return a photo payload',
              });
            } catch (error) {
              failures.push({
                asset,
                message: error?.message || 'Failed to process photo',
              });
            } finally {
              completed += 1;
              setUploadProgress({ current: completed, total, done: false, source: 'library-upload' });
            }
          })
        );

        newPhotos.forEach(appendPhoto);
        if (newPhotos.length > 0) {
          await addPhotoToCache(newPhotos);
        }
      }

      const failedAssets = failures.map((entry) => entry.asset);
      const failedMessages = failures.map((entry) => entry.message).filter(Boolean);

      if (duplicates.length > 0) {
        setDuplicateWarning({
          count: duplicates.length,
          items: duplicates.map((asset) => asset?.filename || asset?.uri).filter(Boolean),
        });
      }

      setUploadSummary({
        uploadedCount,
        duplicateCount: duplicates.length,
        failedCount: failedAssets.length,
        failedMessages,
      });

      setSelectedAssets(failedAssets);
      setUploadProgress({
        current: total,
        total,
        done: true,
        source: 'library-upload',
        uploadedCount,
        duplicateCount: duplicates.length,
        failedCount: failedAssets.length,
      });

      if (failedAssets.length === 0) {
        setTimeout(() => {
          setUploadProgress((prev) => (prev?.source === 'library-upload' ? null : prev));
        }, 1800);
      }
    } catch (error) {
      console.log('Upload failed', error);
      setUploadProgress(null);
      setUploadSummary({
        uploadedCount,
        duplicateCount: duplicates.length,
        failedCount: selectedAssets.length - uploadedCount - duplicates.length,
        failedMessages: [error?.message || 'Upload failed'],
      });
    }
  };

  const isUploading = Boolean(uploadProgress && !uploadProgress.done);
  const isDone = Boolean(uploadProgress?.done);
  const pct = uploadProgress && uploadProgress.total > 0
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0;

  const colors = getThemeColors(themeId);

  return (
    <View className={`flex-1 ${colors.pageBg}`}>
      <View className={`flex-row items-center px-4 pt-16 pb-4 border-b ${colors.headerBg} ${colors.border}`}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/');
            }
          }}
          className="mr-4"
        >
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </Pressable>
        <Text className={`text-2xl font-bold ${colors.headerText}`}>Upload Photos</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 48 }}>
        {!isUploading && (
          <Pressable
            onPress={handleSelectFromGallery}
            className={`flex-row items-center p-5 mb-4 rounded-2xl active:opacity-70 ${colors.cardBg}`}
          >
            <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${colors.pickerCircle}`}>
              <Ionicons name="images-outline" size={22} color={colors.pickerCircleIcon} />
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-semibold ${colors.pickerTitle}`}>Choose from Gallery</Text>
              <Text className={`text-sm mt-0.5 ${colors.pickerSub}`}>Select one or more photos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </Pressable>
        )}

        {!isUploading && uploadSettings.showRecentSuggestions && (
          <View className={`mb-4 p-5 rounded-2xl ${colors.cardBg}`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className={`text-base font-bold ${colors.textPrimary}`}>
                  Recent photos not uploaded yet
                </Text>
                <Text className={`text-sm mt-1 ${colors.textSecondary}`}>
                  {isLoadingSuggestions
                    ? 'Checking your latest device photos...'
                    : recentSuggestions.length > 0
                      ? `${recentSuggestions.length} recent photo${recentSuggestions.length === 1 ? '' : 's'} ready to add`
                      : 'No recent suggestions right now'}
                </Text>
              </View>
              <Pressable
                onPress={handleRefreshSuggestions}
                disabled={isLoadingSuggestions}
                className={`px-3 py-2 rounded-full ${colors.tagBg}`}
                style={{ opacity: isLoadingSuggestions ? 0.5 : 1 }}
              >
                <Text className={`${colors.tagText} text-xs font-semibold`}>
                  Refresh
                </Text>
              </Pressable>
            </View>

            {recentSuggestions.length > 0 && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 14 }}
                >
                  {recentSuggestions.map((asset) => (
                    <Image
                      key={getAssetKey(asset)}
                      source={{ uri: asset.previewUri || asset.uri }}
                      style={{ width: 72, height: 112, borderRadius: 12, marginRight: 10 }}
                    />
                  ))}
                </ScrollView>

                <View className="flex-row flex-wrap gap-2">
                  <Pressable
                    onPress={() => addSuggestedAssets()}
                    className={`px-4 py-2 rounded-full ${colors.button}`}
                  >
                    <Text className="text-white font-semibold">Add Recent</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => addSuggestedAssets(QUICK_PICK_LIMIT)}
                    className={`px-4 py-2 rounded-full ${colors.tagBg}`}
                  >
                    <Text className={`${colors.tagText} font-semibold`}>
                      Add Latest {Math.min(QUICK_PICK_LIMIT, recentSuggestions.length)}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

        {selectedAssets.length > 0 && (
          <View className="mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
              {selectedAssets.map((asset) => (
                <View key={getAssetKey(asset)} style={{ width: 90, height: 140, marginRight: 12 }}>
                  <Image
                    source={{ uri: asset.previewUri || asset.uri }}
                    style={{ width: 90, height: 140, borderRadius: 12, backgroundColor: '#eee' }}
                  />
                  <Pressable
                    onPress={() => removeSelected(asset)}
                    style={{ position: 'absolute', right: 6, top: 6, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: 4 }}
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <View className="flex-row mt-3 px-1">
              <Pressable
                onPress={uploadSelected}
                className={`flex-1 ${colors.button} rounded-2xl p-3 mr-3 items-center justify-center active:opacity-80`}
              >
                <Text className="text-white font-semibold">
                  Upload Selected ({selectedAssets.length})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedAssets([])}
                className={`px-4 py-3 rounded-2xl items-center justify-center ${colors.button}`}
              >
                <Text className="text-white font-semibold">Clear</Text>
              </Pressable>
            </View>
          </View>
        )}

        {duplicateWarning && (
          <View className="mb-4 p-5 bg-[#FFF7ED] rounded-2xl">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-[#F97316] items-center justify-center mr-3">
                <Ionicons name="alert-circle" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-[#B45309] font-bold text-base">
                  Duplicate photo detected
                </Text>
                <Text className="text-[#D97706] text-sm mt-0.5">
                  Existing matches were skipped and kept out of your upload queue.
                </Text>
              </View>
              <Text className="text-[#B45309] font-bold text-base ml-2">
                {duplicateWarning.count}
              </Text>
            </View>
          </View>
        )}

        {isUploading && (
          <View className={`mb-4 p-5 rounded-2xl ${colors.cardBg}`}>
            <View className="flex-row items-center mb-4">
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${colors.iconBg}`}>
                <ActivityIndicator size="small" color={colors.iconColor} />
              </View>
              <View className="flex-1">
                <Text className={`font-bold text-base ${colors.textPrimary}`}>
                  Analyzing your photos
                </Text>
                <Text className={`text-sm mt-0.5 ${colors.textSecondary}`}>
                  AI is describing and indexing your images
                </Text>
              </View>
              <Text className={`font-bold text-base ml-2 ${colors.textPrimary}`}>
                {pct}%
              </Text>
            </View>

            <View className={`h-2 rounded-full overflow-hidden ${colors.line}`}>
              <Animated.View
                className="h-full rounded-full"
                style={{
                  backgroundColor: colors.iconColor,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }}
              />
            </View>

            <View className="flex-row justify-between mt-2">
              <Text className={`text-xs ${colors.textSecondary}`}>
                {uploadProgress.current} of {uploadProgress.total} photo{uploadProgress.total !== 1 ? 's' : ''} done
              </Text>
              <Text className={`text-xs ${colors.textSecondary}`}>
                {uploadProgress.total - uploadProgress.current} remaining
              </Text>
            </View>
          </View>
        )}

        {isDone && uploadSummary && (
          <View className={`mb-4 p-5 rounded-2xl ${colors.cardBg}`}>
            <View className="flex-row items-center">
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${colors.iconBg}`}>
                <Ionicons name="checkmark" size={22} color={colors.iconColor} />
              </View>
              <View className="flex-1">
                <Text className={`font-bold text-base ${colors.textPrimary}`}>
                  Upload complete
                </Text>
                <Text className={`text-sm mt-0.5 ${colors.textSecondary}`}>
                  {uploadSummary.uploadedCount} added, {uploadSummary.duplicateCount} duplicate{uploadSummary.duplicateCount === 1 ? '' : 's'}, {uploadSummary.failedCount} failed
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2 mt-4">
              <View className={`px-3 py-2 rounded-full ${colors.tagBg}`}>
                <Text className={`${colors.tagText} text-sm font-semibold`}>
                  Uploaded {uploadSummary.uploadedCount}
                </Text>
              </View>
              <View className={`px-3 py-2 rounded-full ${colors.tagBg}`}>
                <Text className={`${colors.tagText} text-sm font-semibold`}>
                  Duplicates {uploadSummary.duplicateCount}
                </Text>
              </View>
              <View className={`px-3 py-2 rounded-full ${colors.tagBg}`}>
                <Text className={`${colors.tagText} text-sm font-semibold`}>
                  Failed {uploadSummary.failedCount}
                </Text>
              </View>
            </View>

            {uploadSummary.failedCount > 0 && (
              <Text className={`text-xs mt-3 ${colors.textSecondary}`}>
                Failed items stay selected so you can retry them after checking permissions or connectivity.
              </Text>
            )}
          </View>
        )}

        {!isUploading && !selectedAssets.length && (
          <View className="flex-row items-start mt-4 px-1">
            <Ionicons name="information-circle-outline" size={16} color={colors.infoIcon} style={{ marginTop: 2 }} />
            <Text className={`text-sm ml-1.5 flex-1 ${colors.infoText}`}>
              Upload works best with recent device photos that still have local access. The profile screen now lets you control recent-photo suggestions.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
