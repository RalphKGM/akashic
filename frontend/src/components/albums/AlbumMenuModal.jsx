import { View, Text, Modal, Pressable } from 'react-native';

export default function AlbumMenuModal({ visible, colors, onClose, onRename, onDelete }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <View className="flex-1 justify-end">
          <View className={`mx-4 mb-8 rounded-2xl ${colors.cardBg}`}>
            <Pressable onPress={onRename} className="px-4 py-4 border-b border-black/10">
              <Text className={`text-base ${colors.textPrimary}`}>Rename album</Text>
            </Pressable>
            <Pressable onPress={onDelete} className="px-4 py-4">
              <Text className="text-base text-red-500">Delete album</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
