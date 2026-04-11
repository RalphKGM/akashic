import { View, Text, Modal, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddPhotosModal({
  visible,
  colors,
  isAdding,
  onClose,
  onAdd,
  selectedCount,
  photos,
  renderPhotoItem,
  numColumns,
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className={`flex-1 ${colors.pageBg}`}>
        <View className={`pt-16 pb-4 px-4 border-b ${colors.headerBg} ${colors.border}`}>
          <View className="flex-row items-center justify-between">
            <Pressable onPress={onClose} disabled={isAdding} className="py-1 pr-3">
              <Text className={`text-base ${colors.title}`}>Cancel</Text>
            </Pressable>
            <Text className={`text-lg font-semibold ${colors.title}`}>Add Photos</Text>
            <Pressable
              onPress={onAdd}
              disabled={isAdding}
              className={`py-1 pl-3 ${isAdding ? 'opacity-40' : 'opacity-100'}`}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color={colors.icon} />
              ) : (
                <Text className="text-base font-semibold text-blue-500">Add</Text>
              )}
            </Pressable>
          </View>
          <Text className={`text-xs mt-2 ${colors.count}`}>
            {selectedCount} {selectedCount === 1 ? 'photo selected' : 'photos selected'}
          </Text>
        </View>

        <View className="px-1">
          <FlatList
            data={photos}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={renderPhotoItem}
            ListHeaderComponent={<View className="h-1" />}
            ListFooterComponent={<View className="h-[120px]" />}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-6 pt-24">
                <Ionicons name="images-outline" size={50} color={colors.emptyIcon} />
                <Text className={`text-base font-semibold mt-4 ${colors.textPrimary}`}>
                  No photos to add
                </Text>
                <Text className={`text-sm text-center mt-2 ${colors.textSecondary}`}>
                  All your photos are already in this album.
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}
