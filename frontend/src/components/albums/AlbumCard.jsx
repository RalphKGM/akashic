import { useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '../../theme/appColors.js';
import { useResolvedPhotoUri } from '../../hooks/useResolvedPhotoUri.js';

export const ALBUM_CARD_SIZE = 180;

export default function AlbumCard({ album, onPress, isDarkMode = false }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colors = getThemeColors(isDarkMode);
  const coverPhoto =
    album.photos?.find((photo) => photo.id === album.cover_photo_id) ||
    album.coverPhoto ||
    album.photos?.[0] ||
    null;
  const coverUri = useResolvedPhotoUri(coverPhoto);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Pressable
      onPress={() => onPress(album)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="w-[180px]"
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View className={`w-[180px] h-[180px] rounded-xl overflow-hidden ${colors.placeholderBg}`}>
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={{ width: 180, height: 180 }}  // ← explicit style, not className
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="images-outline" size={28} color={colors.emptyIcon} />
            </View>
          )}
        </View>

        <View className="mt-2 px-0.5">
          <Text className={`text-[13px] font-medium ${colors.title}`} numberOfLines={1}>
            {album.name}
          </Text>
          <Text className={`text-[13px] ${colors.textSecondary}`}>{album.photos.length}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
