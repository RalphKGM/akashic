import { memo, useCallback, useEffect, useRef } from 'react';
import { View, Dimensions, Pressable, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext.jsx';
import { useResolvedPhotoUri } from '../hooks/useResolvedPhotoUri.js';

const { width: windowWidth } = Dimensions.get('window');

function PhotoItem({
  numColumns,
  onPress,
  onLongPress,
  item,
  isSelected = false,
  selectionMode = false,
  onResolvedUri,
}) {
  const { isDarkMode } = useThemeContext();
  const itemRef = useRef(null);
  const size = (windowWidth - 4) / numColumns - 4;
  const resolvedUri = useResolvedPhotoUri(item);

  const isVideo = item?.isVideo || item?.mediaType === 'video';
  const isGif = (item?.device_asset_id || '').toLowerCase().endsWith('.gif');

  const handlePress = useCallback(() => {
    onPress({ item });
  }, [onPress, item]);

  const handleLongPress = useCallback(() => {
    if (!onLongPress) return;

    itemRef.current?.measureInWindow?.((x, y, width, height) => {
      onLongPress({
        item,
        frame: { x, y, width, height },
      });
    });
  }, [onLongPress, item]);

  useEffect(() => {
    if (!onResolvedUri || !item?.id || !resolvedUri || item?.uri === resolvedUri) return;
    onResolvedUri(item.id, resolvedUri);
  }, [item?.id, item?.uri, onResolvedUri, resolvedUri]);

  return (
    <Pressable onPress={handlePress} onLongPress={handleLongPress} delayLongPress={180}>
      <View
        ref={itemRef}
        collapsable={false}
        className={`m-0.5 overflow-hidden ${isDarkMode ? 'bg-zinc-700' : 'bg-gray-200'}`}
        style={{ width: size, height: size }}
      >
        {resolvedUri ? (
          <Image
            source={{ uri: resolvedUri }}
            style={{ width: size, height: size }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <View className={`flex-1 items-center justify-center ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
            <Ionicons name="image-outline" size={18} color={isDarkMode ? '#A1A1AA' : '#9CA3AF'} />
          </View>
        )}

        {isVideo && (
          <View className="absolute bottom-1 right-1 bg-black/55 rounded p-0.5">
            <Ionicons name="play" size={12} color="white" />
          </View>
        )}

        {isGif && !isVideo && (
          <View className="absolute bottom-1 right-1 bg-black/55 rounded px-1 py-0.5">
            <Text className="text-white text-[9px] font-bold">GIF</Text>
          </View>
        )}

        {selectionMode && (
          <View className="absolute top-1.5 right-1.5">
            <View
              className={`w-5 h-5 rounded-full items-center justify-center ${isSelected ? 'bg-blue-500' : 'bg-black/35'}`}
            >
              {isSelected && <Ionicons name="checkmark" size={12} color="white" />}
            </View>
          </View>
        )}

        {!selectionMode && (item?.is_favorite || item?.is_archived || item?.is_hidden) && (
          <View className="absolute top-1.5 left-1.5 flex-row gap-1">
            {item?.is_favorite && (
              <View className="bg-black/55 rounded-full p-1">
                <Ionicons name="heart" size={11} color="#F87171" />
              </View>
            )}
            {item?.is_archived && (
              <View className="bg-black/55 rounded-full p-1">
                <Ionicons name="archive" size={11} color="white" />
              </View>
            )}
            {item?.is_hidden && (
              <View className="bg-black/55 rounded-full p-1">
                <Ionicons name="eye-off" size={11} color="white" />
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default memo(PhotoItem);
