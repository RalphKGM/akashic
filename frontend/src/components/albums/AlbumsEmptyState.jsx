import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AlbumsEmptyState({ colors, isRefreshing, onRefresh }) {
  return (
    <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
      <View className="flex-1 items-center justify-center px-6 pt-32">
        <Ionicons name="albums-outline" size={64} color={colors.emptyIcon} />
        <Text className={`text-lg font-semibold mt-4 ${colors.textPrimary}`}>No albums yet</Text>
        <Text className={`text-sm text-center mt-2 ${colors.textSecondary}`}>
          Tap + to create an album from your photos
        </Text>
      </View>
    </ScrollView>
  );
}
