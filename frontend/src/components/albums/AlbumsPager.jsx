import { View, FlatList } from 'react-native';

export default function AlbumsPager({
  albumPages,
  renderAlbumPage,
  currentPage,
  colors,
  screenWidth,
  onPageChange,
}) {
  const hasTwoRows = albumPages.some((page) => page.length > 2);
  // 1 row height ~= 180 (card) + 2 lines text + margins + page padding.
  const pagerHeight = hasTwoRows ? 468 : 246;

  return (
    <View>
      <View style={{ height: pagerHeight }}>
        <FlatList
          data={albumPages}
          horizontal
          pagingEnabled
          keyExtractor={(_, index) => `page-${index}`}
          renderItem={renderAlbumPage}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          directionalLockEnabled
          onMomentumScrollEnd={(e) => {
            const pageIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            onPageChange(pageIndex);
          }}
        />
      </View>
      {albumPages.length > 1 && (
        <View className="flex-row items-center justify-center gap-1.5 pb-2">
          {albumPages.map((_, index) => (
            <View
              key={`dot-${index}`}
              className={`${colors.dotBg} w-1.5 h-1.5 rounded-full ${
                index === currentPage ? 'opacity-100' : 'opacity-40'
              }`}
            />
          ))}
        </View>
      )}
      <View className={`mx-4 h-px ${colors.line}`} />
    </View>
  );
}
