import { memo, useCallback } from 'react';
import { View, Dimensions, Pressable, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeContext.jsx';
import { Platform } from 'react-native';

const { width: windowWidth } = Dimensions.get('window');

function PhotoItem({
  numColumns,
  onPress,
  onLongPress,
  item,
  isSelected = false,
  selectionMode = false,
}) {
  const { isDarkMode } = useThemeContext();
  const size = (windowWidth - 4) / numColumns - 4;

  const isVideo = item?.isVideo || item?.mediaType === 'video';
  const isGif = (item?.device_asset_id || '').toLowerCase().endsWith('.gif');

  const handlePress = useCallback(() => {
    onPress({ item });
  }, [onPress, item]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) onLongPress({ item });
  }, [onLongPress, item]);

  return (
    <Pressable onPress={handlePress} onLongPress={handleLongPress} delayLongPress={180}>
      <View
        className={`m-0.5 overflow-hidden ${isDarkMode ? 'bg-zinc-700' : 'bg-gray-200'}`}
        style={{ width: size, height: size }}
      >
        <Image
          source={{ uri: item.uri ? item.uri : (Platform.OS === 'android' ? `content://media/external/images/media/${item.device_asset_id}` : `ph://${item.device_asset_id}`) }}
          style={{ width: size, height: size }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />

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
      </View>
    </Pressable>
  );
}

export default memo(PhotoItem);