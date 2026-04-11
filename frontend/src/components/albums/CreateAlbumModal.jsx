import { View, Text, Modal, Pressable, TextInput, ActivityIndicator, FlatList } from 'react-native';

export default function CreateAlbumModal({
  visible,
  colors,
  isCreating,
  onClose,
  onCreate,
  albumName,
  onChangeName,
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
            <Pressable onPress={onClose} disabled={isCreating} className="py-1 pr-3">
              <Text className={`text-base ${colors.title}`}>Cancel</Text>
            </Pressable>
            <Text className={`text-lg font-semibold ${colors.title}`}>New Album</Text>
            <Pressable
              onPress={onCreate}
              disabled={isCreating}
              className={`py-1 pl-3 ${isCreating ? 'opacity-40' : 'opacity-100'}`}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={colors.icon} />
              ) : (
                <Text className="text-base font-semibold text-blue-500">Create</Text>
              )}
            </Pressable>
          </View>
          <TextInput
            value={albumName}
            onChangeText={onChangeName}
            placeholder="Album name"
            placeholderTextColor={colors.inputPlaceholder}
            className={`mt-3 rounded-xl px-4 py-3 ${colors.inputBg} ${colors.inputText}`}
            editable={!isCreating}
            returnKeyType="done"
          />
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
          />
        </View>
      </View>
    </Modal>
  );
}
