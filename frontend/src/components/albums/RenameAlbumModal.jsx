import { View, Text, Modal, Pressable, TextInput, ActivityIndicator } from 'react-native';

export default function RenameAlbumModal({
  visible,
  colors,
  isRenaming,
  onClose,
  onSave,
  value,
  onChangeValue,
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className={`flex-1 ${colors.pageBg}`}>
        <View className={`pt-16 pb-4 px-4 border-b ${colors.headerBg} ${colors.border}`}>
          <View className="flex-row items-center justify-between">
            <Pressable onPress={onClose} disabled={isRenaming} className="py-1 pr-3">
              <Text className={`text-base ${colors.title}`}>Cancel</Text>
            </Pressable>
            <Text className={`text-lg font-semibold ${colors.title}`}>Rename Album</Text>
            <Pressable
              onPress={onSave}
              disabled={isRenaming}
              className={`py-1 pl-3 ${isRenaming ? 'opacity-40' : 'opacity-100'}`}
            >
              {isRenaming ? (
                <ActivityIndicator size="small" color={colors.icon} />
              ) : (
                <Text className="text-base font-semibold text-blue-500">Save</Text>
              )}
            </Pressable>
          </View>
          <TextInput
            value={value}
            onChangeText={onChangeValue}
            placeholder="Album name"
            placeholderTextColor={colors.inputPlaceholder}
            className={`mt-3 rounded-xl px-4 py-3 ${colors.inputBg} ${colors.inputText}`}
            editable={!isRenaming}
            returnKeyType="done"
          />
        </View>
      </View>
    </Modal>
  );
}
