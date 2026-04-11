import { View, Text, Pressable, ScrollView, ActivityIndicator, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useRef } from 'react';
import { processSinglePhoto } from '../service/photoService';
import { usePhotoContext } from '../context/PhotoContext';
import { useThemeContext } from '../context/ThemeContext.jsx';
import { getThemeColors } from '../theme/appColors.js';
import { addPhotoToCache } from '../service/cacheService.js';

export default function Upload() {
  const router = useRouter();
  const { appendPhoto, uploadProgress, setUploadProgress } = usePhotoContext();
  const { isDarkMode } = useThemeContext();
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);

  const progressAnim = useRef(new Animated.Value(0)).current;

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
  }, [uploadProgress?.current]);

  const handleSelectFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 50, 
      quality: 1,
    });

    if (!result.canceled) {
      // photo selection preview
      // append new selections to existing ones instead of replacing
      const newAssets = result.assets || [];
      setSelectedAssets((prev) => {
        const existingUris = new Set(prev.map((a) => a.uri));
        const merged = [...prev];
        newAssets.forEach((a) => {
          if (!existingUris.has(a.uri)) merged.push(a);
        });
        return merged;
      });
    }
  };

  const removeSelected = (uri) => {
    setSelectedAssets((prev) => prev.filter((a) => a.uri !== uri));
  };

  const uploadSelected = async () => {
    if (!selectedAssets || selectedAssets.length === 0) return;
    const total = selectedAssets.length;
    const CONCURRENCY = 3;
    setDuplicateWarning(null);
    setUploadProgress({ current: 0, total, done: false });
    progressAnim.setValue(0);

    const duplicates = [];
    let completed = 0;

    try {
      for (let i = 0; i < selectedAssets.length; i += CONCURRENCY) {
        const chunk = selectedAssets.slice(i, i + CONCURRENCY);
        const newPhotos = [];

        await Promise.allSettled(
          chunk.map(async (asset, j) => {
            try {
              const res = await processSinglePhoto(asset);
              if (res?.duplicate) {
                duplicates.push(asset.uri);
              } else if (res?.photo) {
                newPhotos.push({
                  device_asset_id: res.photo.device_asset_id,
                  uri: asset.uri,
                  descriptive: res.photo.descriptive || null,
                  literal: res.photo.literal || null,
                  id: res.photo.id || null,
                  category: res.photo.category,
                  tags: res.photo.tags,
                  is_favorite: res.photo.is_favorite ?? false,
                  is_archived: res.photo.is_archived ?? false,
                  is_hidden: res.photo.is_hidden ?? false,
                  created_at: res.photo.created_at || null,
                });
              }
            } catch (err) {
              console.log(`Photo ${i + j + 1} failed:`, err?.message);
            } finally {
              completed += 1;
              setUploadProgress({ current: completed, total, done: false });
            }
          })
        );

        // append + cache all successful photos from this chunk
        newPhotos.forEach(appendPhoto);
        if (newPhotos.length > 0) await addPhotoToCache(newPhotos);
      }

      if (duplicates.length > 0) {
        setDuplicateWarning({ count: duplicates.length, items: duplicates });
      }

      setUploadProgress({ current: total, total, done: true });
      setTimeout(() => {
        setUploadProgress(null);
        setSelectedAssets([]);
      }, 1500);
    } catch (e) {
      console.log('Upload failed', e);
      setUploadProgress(null);
    }
  };
  const isUploading = uploadProgress && !uploadProgress.done;
  const isDone = uploadProgress?.done;
  const pct = uploadProgress
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0;

  const colors = getThemeColors(isDarkMode);

  return (
    <View className={`flex-1 ${colors.pageBg}`}>
      {/* header */}
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

      <ScrollView className="flex-1 px-4 pt-6">

        {/* pick from gallery button — hidden while uploading */}
        {!isUploading && !isDone && (
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

        {/* selected preview (before upload) */}
        {selectedAssets.length > 0 && (
          <View className="mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
              {selectedAssets.map((a) => (
                <View key={a.uri} style={{ width: 90, height: 140, marginRight: 12 }}>
                  <Image source={{ uri: a.uri }} style={{ width: 90, height: 140, borderRadius: 12, backgroundColor: '#eee' }} />
                  <Pressable
                    onPress={() => removeSelected(a.uri)}
                    style={{ position: 'absolute', right: 6, top: 6, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: 4 }}
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <View className="flex-row mt-3 px-1">
              <Pressable onPress={uploadSelected} className={`flex-1 ${colors.button} rounded-2xl p-3 mr-3 items-center justify-center active:opacity-80`}>
                <Text className="text-white font-semibold">Upload Selected ({selectedAssets.length})</Text>
              </Pressable>
              <Pressable onPress={() => setSelectedAssets([])} className={`px-4 py-3 rounded-2xl items-center justify-center ${colors.button}`}>
                <Text className="text-white font-semibold">Clear</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* duplicate warning card */}
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
                  One or more selected photos already exist in your library
                </Text>
              </View>
              <Text className="text-[#B45309] font-bold text-base ml-2">
                {duplicateWarning.count}
              </Text>
            </View>


          </View>
        )}

        {/* upload progress card */}
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
        
        {isDone && (
          <View className={`mb-4 p-5 rounded-2xl ${colors.cardBg}`}>
            <View className="flex-row items-center">
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${colors.iconBg}`}>
                <Ionicons name="checkmark" size={22} color={colors.iconColor} />
              </View>
              <View className="flex-1">
                <Text className={`font-bold text-base ${colors.textPrimary}`}>
                  All done!
                </Text>
                <Text className={`text-sm mt-0.5 ${colors.textSecondary}`}>
                  {uploadProgress.total} photo{uploadProgress.total !== 1 ? 's' : ''} added to your library
                </Text>
              </View>
            </View>
            <View className={`h-2 rounded-full overflow-hidden mt-4 ${colors.line}`}>
              <View className="h-full rounded-full w-full" style={{ backgroundColor: colors.iconColor }} />
            </View>
          </View>
        )}

        {!isUploading && !isDone && (
          <View className="flex-row items-start mt-4 px-1">
            <Ionicons name="information-circle-outline" size={16} color={colors.infoIcon} style={{ marginTop: 2 }} />
            <Text className={`text-sm ml-1.5 flex-1 ${colors.infoText}`}>
              Photos will be analyzed and added to your library automatically.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
