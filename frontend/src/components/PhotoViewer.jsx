import { Modal, View, Pressable, Animated, Text, ScrollView, Dimensions, Alert, ActivityIndicator, TextInput, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import PagerView from 'react-native-pager-view';
import { useThemeContext } from '../context/ThemeContext.jsx';
import { getThemeColors } from '../theme/appColors.js';
import ZoomablePhoto from './ZoomablePhoto.jsx';
import { useResolvedPhotoUri } from '../hooks/useResolvedPhotoUri.js';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function TagPill({ tag, colors }) {
  return (
    <View className={`rounded-full px-3 py-1 mr-2 mb-2 ${colors.tagBg}`}>
      <Text className={`text-xs ${colors.tagText}`}>{tag}</Text>
    </View>
  );
}

function ViewerPage({ photo, shouldRender, isActive }) {
  const photoData = photo?.item ?? photo;
  const resolvedUri = useResolvedPhotoUri(photoData);

  if (!shouldRender) {
    return <View className="w-full h-full bg-black" />;
  }

  if (!resolvedUri) {
    return <ActivityIndicator size="large" color="white" />;
  }

  return <ZoomablePhoto uri={resolvedUri} isActive={isActive} />;
}

export default function PhotoViewer({
  visible,
  photos = [],
  initialIndex = 0,
  onClose,
  onDelete,
  onSaveDescriptions,
  onUpdatePreferences,
  isDeleting = false
}) {
  const { isDarkMode } = useThemeContext();
  const colors = getThemeColors(isDarkMode);
  const pagerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  const [sheetVisible, setSheetVisible] = useState(false);
  const [literalDraft, setLiteralDraft] = useState('');
  const [descriptiveDraft, setDescriptiveDraft] = useState('');
  const [isSavingDescriptions, setIsSavingDescriptions] = useState(false);
  const [isEditingDescriptions, setIsEditingDescriptions] = useState(false);
  const [updatingPreferenceKey, setUpdatingPreferenceKey] = useState(null);

  const currentPhoto = photos?.[currentIndex];
  const photoData = currentPhoto?.item ?? currentPhoto;
  const tags = photoData?.tags
    ? photoData.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];
  const currentLiteral = photoData?.literal ?? '';
  const currentDescriptive = photoData?.descriptive ?? '';
  const isFavorite = Boolean(photoData?.is_favorite);
  const isArchived = Boolean(photoData?.is_archived);
  const isHidden = Boolean(photoData?.is_hidden);
  const hasDescriptionChange =
    literalDraft.trim() !== currentLiteral.trim() ||
    descriptiveDraft.trim() !== currentDescriptive.trim();
  const canSave =
    Boolean(onSaveDescriptions) &&
    !isSavingDescriptions &&
    hasDescriptionChange &&
    literalDraft.trim().length > 0 &&
    descriptiveDraft.trim().length > 0;

  useEffect(() => {
    setLiteralDraft(currentLiteral);
    setDescriptiveDraft(currentDescriptive);
    setIsEditingDescriptions(false);
  }, [currentPhoto?.id, currentLiteral, currentDescriptive]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const height = event?.endCoordinates?.height ?? 0;
      const target = -Math.max(0, height - 16);
      Animated.timing(keyboardAnim, {
        toValue: target,
        duration: Platform.OS === 'ios' ? (event?.duration ?? 250) : 220,
        useNativeDriver: true,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const openSheet = () => {
    setSheetVisible(true);
    Animated.parallel([
      Animated.spring(sheetAnim, {
        toValue: 0,
        tension: 65,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setSheetVisible(false));
  };

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setTimeout(() => {
        pagerRef.current?.setPageWithoutAnimation(initialIndex);
      }, 0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      sheetAnim.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);
      keyboardAnim.setValue(0);
      setSheetVisible(false);
    }
  }, [visible, initialIndex]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Photo',
      'This will remove the photo from your library. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  const handleSaveDescriptions = async () => {
    if (!canSave) return;

    try {
      setIsSavingDescriptions(true);
      await onSaveDescriptions({
        photoId: photoData?.id,
        literal: literalDraft.trim(),
        descriptive: descriptiveDraft.trim(),
      });
      setIsEditingDescriptions(false);
      Alert.alert('Saved', 'Descriptions and embeddings updated.');
    } catch (error) {
      Alert.alert('Save failed', error.message || 'Failed to save descriptions');
    } finally {
      setIsSavingDescriptions(false);
    }
  };

  const handlePreferenceUpdate = async (patch, key) => {
    if (!photoData?.id || !onUpdatePreferences || updatingPreferenceKey) return;

    try {
      setUpdatingPreferenceKey(key);
      await onUpdatePreferences({
        photoId: photoData.id,
        isFavorite: patch.is_favorite ?? photoData.is_favorite,
        isArchived: patch.is_archived ?? photoData.is_archived,
        isHidden: patch.is_hidden ?? photoData.is_hidden,
      });
    } catch (error) {
      Alert.alert('Update failed', error.message || 'Failed to update photo');
    } finally {
      setUpdatingPreferenceKey(null);
    }
  };

  if (!visible || !photos?.length) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <StatusBar style="light" />
      <View className="flex-1 bg-black">
        <Animated.View style={{ flex: 1, opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
          <PagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={initialIndex}
            onPageSelected={(e) => {
              setCurrentIndex(e.nativeEvent.position);
              if (sheetVisible) closeSheet();
            }}
          >
            {photos.map((photo, index) => {
              const key = photo.item?.id ?? photo.id ?? index;
              const shouldRender = Math.abs(index - currentIndex) <= 3;

              return (
                <View key={key} className="flex-1 justify-center items-center">
                  <ViewerPage
                    photo={photo}
                    shouldRender={shouldRender}
                    isActive={index === currentIndex}
                  />
                </View>
              );
            })}
          </PagerView>
        </Animated.View>

        <Pressable onPress={onClose} className="absolute top-14 left-4 z-50 flex-row items-center p-2">
          <Ionicons name="chevron-back" size={28} color="white" />
          <Text className="text-white text-base font-medium">Back</Text>
        </Pressable>

        {photos.length > 1 && (
          <View className="absolute top-14 right-4 z-50 bg-black/50 rounded-full px-3 py-1">
            <Text className="text-white text-sm font-medium">
              {currentIndex + 1} / {photos.length}
            </Text>
          </View>
        )}

        <View className="absolute bottom-12 right-6 z-50 flex-row items-center gap-4">
          {onUpdatePreferences && (
            <Pressable
              onPress={() => handlePreferenceUpdate({ is_favorite: !isFavorite }, 'favorite')}
              disabled={Boolean(updatingPreferenceKey)}
              className="p-2"
              style={{ opacity: updatingPreferenceKey ? 0.4 : 1 }}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={28}
                color={isFavorite ? '#F87171' : 'white'}
              />
            </Pressable>
          )}
          <Pressable onPress={openSheet} className="p-2">
            <Ionicons name="information-circle-outline" size={28} color="white" />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            className="p-2"
            style={{ opacity: isDeleting ? 0.4 : 1 }}
          >
            {isDeleting
              ? <ActivityIndicator size="small" color="white" />
              : <Ionicons name="trash-outline" size={28} color="white" />
            }
          </Pressable>
        </View>

        {sheetVisible && (
          <>
            <Animated.View
              style={{ opacity: backdropAnim }}
              className="absolute inset-0 bg-black/60 z-50"
            >
              <Pressable className="flex-1" onPress={closeSheet} />
            </Animated.View>

            <Animated.View
              style={{
                transform: [{ translateY: sheetAnim }, { translateY: keyboardAnim }],
                height: SCREEN_HEIGHT * 0.5,
              }}
              className={`absolute bottom-0 left-0 right-0 z-50 rounded-t-2xl ${colors.sheetBg}`}
            >
              <View className={`flex-row items-center justify-between px-5 py-4 border-b ${colors.sheetBorder}`}>
                <Text className={`text-lg font-semibold ${colors.title}`}>Photo Info</Text>
                <View className="flex-row items-center gap-3">
                  <Pressable
                    onPress={() => {
                      if (isEditingDescriptions) {
                        setLiteralDraft(currentLiteral);
                        setDescriptiveDraft(currentDescriptive);
                      }
                      setIsEditingDescriptions((prev) => !prev);
                    }}
                    disabled={isSavingDescriptions}
                    style={{ opacity: isSavingDescriptions ? 0.5 : 1 }}
                  >
                    <Ionicons name={isEditingDescriptions ? 'create' : 'create-outline'} size={20} color={colors.icon} />
                  </Pressable>
                  <Pressable onPress={closeSheet}>
                    <Ionicons name="close" size={22} color={colors.icon} />
                  </Pressable>
                </View>
              </View>

              <ScrollView
                className="px-5 pt-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {isEditingDescriptions ? (
                  <>
                    <View className="mb-4">
                      <Text className={`text-sm font-semibold tracking-wider mb-1 ${colors.title}`}>Literal</Text>
                      <TextInput
                        value={literalDraft}
                        onChangeText={setLiteralDraft}
                        multiline
                        textAlignVertical="top"
                        placeholder="Enter literal description"
                        placeholderTextColor={colors.inputPlaceholder}
                        className={`${colors.inputBg} rounded-xl px-3 py-3 ${colors.inputText} text-sm`}
                        style={{ minHeight: 90 }}
                      />
                    </View>
                    <View className="mb-4">
                      <Text className={`text-sm font-semibold tracking-wider mb-1 ${colors.title}`}>Descriptive</Text>
                      <TextInput
                        value={descriptiveDraft}
                        onChangeText={setDescriptiveDraft}
                        multiline
                        textAlignVertical="top"
                        placeholder="Enter descriptive description"
                        placeholderTextColor={colors.inputPlaceholder}
                        className={`${colors.inputBg} rounded-xl px-3 py-3 ${colors.inputText} text-sm`}
                        style={{ minHeight: 110 }}
                      />
                    </View>
                    {hasDescriptionChange && (
                      <Pressable
                        onPress={handleSaveDescriptions}
                        disabled={!canSave}
                        className="mb-4 rounded-xl py-3 items-center justify-center bg-black"
                        style={{ opacity: canSave ? 1 : 0.45 }}
                      >
                        {isSavingDescriptions ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text className="text-white text-sm font-semibold">Save Descriptions</Text>
                        )}
                      </Pressable>
                    )}
                  </>
                ) : (
                  <>
                    {photoData?.literal && (
                      <View className="mb-4">
                        <Text className={`text-sm font-semibold tracking-wider mb-1 ${colors.title}`}>Literal</Text>
                        <Text className={`text-md leading-relaxed ${colors.body}`}>{photoData.literal}</Text>
                      </View>
                    )}
                    {photoData?.descriptive && (
                      <View className="mb-4">
                        <Text className={`text-sm font-semibold tracking-wider mb-1 ${colors.title}`}>Descriptive</Text>
                        <Text className={`text-md leading-relaxed ${colors.body}`}>{photoData.descriptive}</Text>
                      </View>
                    )}
                  </>
                )}

                {onUpdatePreferences && (
                  <View className="mb-5">
                    <Text className={`text-xs font-semibold uppercase tracking-wider mb-2 ${colors.title}`}>Actions</Text>
                    <View className="flex-row flex-wrap gap-2">
                      <Pressable
                        onPress={() => handlePreferenceUpdate({ is_favorite: !isFavorite }, 'favorite')}
                        disabled={Boolean(updatingPreferenceKey)}
                        className={`px-3 py-2 rounded-full ${colors.tagBg}`}
                        style={{ opacity: updatingPreferenceKey ? 0.5 : 1 }}
                      >
                        <Text className={`${colors.tagText} text-sm`}>
                          {isFavorite ? 'Remove favorite' : 'Add favorite'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handlePreferenceUpdate({ is_archived: !isArchived }, 'archived')}
                        disabled={Boolean(updatingPreferenceKey)}
                        className={`px-3 py-2 rounded-full ${colors.tagBg}`}
                        style={{ opacity: updatingPreferenceKey ? 0.5 : 1 }}
                      >
                        <Text className={`${colors.tagText} text-sm`}>
                          {isArchived ? 'Unarchive' : 'Archive'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handlePreferenceUpdate({ is_hidden: !isHidden }, 'hidden')}
                        disabled={Boolean(updatingPreferenceKey)}
                        className={`px-3 py-2 rounded-full ${colors.tagBg}`}
                        style={{ opacity: updatingPreferenceKey ? 0.5 : 1 }}
                      >
                        <Text className={`${colors.tagText} text-sm`}>
                          {isHidden ? 'Unhide' : 'Hide'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {tags.length > 0 && (
                  <View className="mb-4">
                    <Text className={`text-xs font-semibold uppercase tracking-wider mb-2 ${colors.title}`}>Tags</Text>
                    <View className="flex-row flex-wrap">
                      {tags.map((tag, i) => (
                        <TagPill key={i} tag={tag} colors={colors} />
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </>
        )}
      </View>
    </Modal>
  );
}
