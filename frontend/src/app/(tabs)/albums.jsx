import { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { usePhotoContext } from '../../context/PhotoContext';
import { useThemeContext } from '../../context/ThemeContext.jsx';
import { getThemeColors } from '../../theme/appColors.js';
import AlbumDetail from '../../components/albums/AlbumDetail.jsx';
import AlbumCard from '../../components/albums/AlbumCard.jsx';
import PhotoItem from '../../components/PhotoItem.jsx';
import AlbumsHeader from '../../components/albums/AlbumsHeader.jsx';
import AlbumsEmptyState from '../../components/albums/AlbumsEmptyState.jsx';
import AlbumsPager from '../../components/albums/AlbumsPager.jsx';
import CreateAlbumModal from '../../components/albums/CreateAlbumModal.jsx';
import AddPhotosModal from '../../components/albums/AddPhotosModal.jsx';
import AlbumMenuModal from '../../components/albums/AlbumMenuModal.jsx';
import RenameAlbumModal from '../../components/albums/RenameAlbumModal.jsx';
import useAlbums from '../../hooks/useAlbums.js';

const CREATE_COLUMNS = 4;
const CATEGORY_ORDER = ['food', 'nature', 'animals', 'people', 'travel'];

export default function Albums() {
  const { photos, setPhotos } = usePhotoContext();
  const { isDarkMode } = useThemeContext();
  const colors = getThemeColors(isDarkMode);
  const albumCardGap = 12;
  const activePhotos = useMemo(
    () => photos.filter((photo) => !photo?.is_hidden && !photo?.is_archived),
    [photos]
  );
  const {
    screenWidth,
    slideAnim,
    albums,
    openAlbum,
    albumPages,
    isLoading,
    isRefreshing,
    currentAlbumPage,
    isCreateAlbumVisible,
    selectedPhotoIds,
    newAlbumName,
    isCreatingAlbum,
    isAddPhotosVisible,
    selectedAddPhotoIds,
    isAddingPhotos,
    isAlbumMenuVisible,
    isRenameVisible,
    renameValue,
    isRenamingAlbum,
    availablePhotos,
    loadAlbums,
    setCurrentAlbumPage,
    setNewAlbumName,
    setRenameValue,
    handleOpenAlbum,
    handleCloseAlbum,
    handleAlbumPhotosChange,
    openCreateAlbum,
    closeCreateAlbum,
    openAddPhotos,
    closeAddPhotos,
    openAlbumMenu,
    closeAlbumMenu,
    openRenameModal,
    closeRenameModal,
    toggleSelectedPhoto,
    toggleSelectedAddPhoto,
    handleCreateAlbum,
    handleAddPhotos,
    handleRemoveFromAlbum,
    handleRenameAlbum,
    handleDeleteAlbum,
  } = useAlbums({ photos: activePhotos, setPhotos });
  const albumCardSize = Math.floor((screenWidth - 32 - albumCardGap) / 2);

  const categoryAlbums = useMemo(() => {
    const grouped = {};
    for (const photo of activePhotos) {
      const category = photo.category?.toLowerCase();
      if (!category || category === 'none') continue;
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(photo);
    }
    return CATEGORY_ORDER
      .filter(cat => grouped[cat]?.length > 0)
      .map(cat => ({
        id: `category_${cat}`,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        photos: grouped[cat],
        isCategory: true,
      }));
  }, [activePhotos]);

  const categoryAlbumRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < categoryAlbums.length; i += 2) {
      rows.push(categoryAlbums.slice(i, i + 2));
    }
    return rows;
  }, [categoryAlbums]);

  const renderAlbumPage = useCallback(
    ({ item: page }) => (
      <View className="w-screen px-4 pt-5 pb-3">
        <View
          className={page.length > 2 ? 'mb-3 flex-row justify-between' : 'flex-row justify-between'}
          style={{ columnGap: albumCardGap }}
        >
          {page.slice(0, 2).map((album) => (
            <View key={album.id} style={{ width: albumCardSize }}>
              <AlbumCard album={album} onPress={handleOpenAlbum} isDarkMode={isDarkMode} size={albumCardSize} />
            </View>
          ))}
          {page.length === 1 && <View style={{ width: albumCardSize }} />}
        </View>
        {page.length > 2 && (
          <View className="flex-row justify-between" style={{ columnGap: albumCardGap }}>
            {page.slice(2, 4).map((album) => (
              <View key={album.id} style={{ width: albumCardSize }}>
                <AlbumCard album={album} onPress={handleOpenAlbum} isDarkMode={isDarkMode} size={albumCardSize} />
              </View>
            ))}
            {page.length === 3 && <View style={{ width: albumCardSize }} />}
          </View>
        )}
      </View>
    ),
    [albumCardGap, albumCardSize, handleOpenAlbum, isDarkMode]
  );

  const renderCreatePhotoItem = useCallback(
    ({ item }) => (
      <PhotoItem
        localUri={item.uri ?? null}
        numColumns={CREATE_COLUMNS}
        onPress={() => toggleSelectedPhoto(item.id)}
        onLongPress={() => toggleSelectedPhoto(item.id)}
        item={item}
        isSelected={selectedPhotoIds.includes(item.id)}
        selectionMode
      />
    ),
    [toggleSelectedPhoto, selectedPhotoIds]
  );

  const renderAddPhotoItem = useCallback(
    ({ item }) => (
      <PhotoItem
        localUri={item.uri ?? null}
        numColumns={CREATE_COLUMNS}
        onPress={() => toggleSelectedAddPhoto(item.id)}
        onLongPress={() => toggleSelectedAddPhoto(item.id)}
        item={item}
        isSelected={selectedAddPhotoIds.includes(item.id)}
        selectionMode
      />
    ),
    [toggleSelectedAddPhoto, selectedAddPhotoIds]
  );

  const totalPhotosInAlbums = useMemo(
    () => albums.reduce((sum, album) => sum + album.photos.length, 0),
    [albums]
  );

  return (
    <View className={`flex-1 ${colors.pageBg}`}>
      <AlbumsHeader
        colors={colors}
        albumsCount={albums.length}
        totalPhotosInAlbums={totalPhotosInAlbums}
        isLoading={isLoading}
        onAddPress={openCreateAlbum}
        disableAdd={activePhotos.length === 0}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.loading} />
        </View>
      ) : albums.length === 0 && categoryAlbums.length === 0 ? (
        <AlbumsEmptyState colors={colors} isRefreshing={isRefreshing} onRefresh={() => loadAlbums(true)} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 240 }}
        >
          {/* Custom Albums (pager) */}
          {albums.length > 0 && (
            <AlbumsPager
              albumPages={albumPages}
              renderAlbumPage={renderAlbumPage}
              currentPage={currentAlbumPage}
              colors={colors}
              screenWidth={screenWidth}
              onPageChange={setCurrentAlbumPage}
              cardSize={albumCardSize}
              cardGap={albumCardGap}
            />
          )}

          {/* Category Albums */}
          {categoryAlbums.length > 0 && (
            <>
              {/* Header divider */}
              <View className="mx-4 mt-2 mb-1">
                 
                <Text className={`mx-3 mt-5 text-s font-bold uppercase ${colors.textSecondary}`}>
                  Category
                </Text>
          
              </View>

              {/* Same px/pt/pb as renderAlbumPage, 2-per-row grid */}
              <View className="px-4 pt-5 pb-3">
                {categoryAlbumRows.map((row, i) => (
                  <View
                    key={i}
                    className="flex-row justify-between"
                    style={{ marginBottom: i < categoryAlbumRows.length - 1 ? 12 : 0, columnGap: albumCardGap }}
                  >
                    {row.map((album) => (
                      <View key={album.id} style={{ width: albumCardSize }}>
                        <AlbumCard
                          album={album}
                          onPress={handleOpenAlbum}
                          isDarkMode={isDarkMode}
                          size={albumCardSize}
                        />
                      </View>
                    ))}
                    {/* Keep right side aligned when only 1 in row */}
                    {row.length === 1 && <View style={{ width: albumCardSize }} />}
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {openAlbum && (
        <Animated.View
          className={`absolute inset-0 z-10 ${colors.pageBg}`}
          style={{ transform: [{ translateX: slideAnim }] }}
        >
          <AlbumDetail
            album={openAlbum}
            onBack={handleCloseAlbum}
            onPhotosChange={handleAlbumPhotosChange}
            onAddPhotos={openAddPhotos}
            canAddPhotos={availablePhotos.length > 0}
            onRemovePhotos={handleRemoveFromAlbum}
            onOpenMenu={openAlbumMenu}
          />
        </Animated.View>
      )}

      <CreateAlbumModal
        visible={isCreateAlbumVisible}
        colors={colors}
        isCreating={isCreatingAlbum}
        onClose={closeCreateAlbum}
        onCreate={handleCreateAlbum}
        albumName={newAlbumName}
        onChangeName={setNewAlbumName}
        selectedCount={selectedPhotoIds.length}
        photos={activePhotos}
        renderPhotoItem={renderCreatePhotoItem}
        numColumns={CREATE_COLUMNS}
      />

      <AddPhotosModal
        visible={isAddPhotosVisible}
        colors={colors}
        isAdding={isAddingPhotos}
        onClose={closeAddPhotos}
        onAdd={handleAddPhotos}
        selectedCount={selectedAddPhotoIds.length}
        photos={availablePhotos}
        renderPhotoItem={renderAddPhotoItem}
        numColumns={CREATE_COLUMNS}
      />

      <AlbumMenuModal
        visible={isAlbumMenuVisible}
        colors={colors}
        onClose={closeAlbumMenu}
        onRename={openRenameModal}
        onDelete={handleDeleteAlbum}
      />

      <RenameAlbumModal
        visible={isRenameVisible}
        colors={colors}
        isRenaming={isRenamingAlbum}
        onClose={closeRenameModal}
        onSave={handleRenameAlbum}
        value={renameValue}
        onChangeValue={setRenameValue}
      />
    </View>
  );
}
