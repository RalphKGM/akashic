import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AlbumsHeader({
  colors,
  albumsCount,
  totalPhotosInAlbums,
  isLoading,
  onAddPress,
  disableAdd,
}) {
  return (
    <View className={`pt-16 pb-6 px-4 border-b ${colors.headerBg} ${colors.border}`}>
      <View className="flex-row items-center justify-between">
        <Text className={`text-3xl font-extrabold tracking-tight ${colors.textPrimary}`}>Albums</Text>
        <Pressable onPress={onAddPress} disabled={disableAdd}>
          <Ionicons name="add" size={30} color={disableAdd ? '#9CA3AF' : colors.icon} />
        </Pressable>
      </View>
      {!isLoading && (
        <Text className={`text-xs mt-1 ${colors.count}`}>
          {albumsCount} {albumsCount === 1 ? 'album' : 'albums'} | {totalPhotosInAlbums}{' '}
          {totalPhotosInAlbums === 1 ? 'photo' : 'photos'}
        </Text>
      )}
    </View>
  );
}
