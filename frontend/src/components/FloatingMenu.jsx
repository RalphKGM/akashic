import { View, Text, Pressable, Animated } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { takePhoto } from '../service/photoService.js';
import { useRouter } from 'expo-router';
import { usePhotoContext } from '../context/PhotoContext';
import { useThemeContext } from '../context/ThemeContext.jsx';
import { getThemeColors } from '../theme/appColors.js';

export default function FloatingMenu({ menuAnim, isDarkMode, size = 0 }) {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const { appendPhoto, setUploadProgress } = usePhotoContext();
  const colors = getThemeColors(isDarkMode);

  const circleBg      = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const circleBorder  = isDarkMode ? '#3A3A3C' : '#D1D1D6';
  const iconColor     = isDarkMode ? '#FFFFFF'  : '#000000';
  const shadowOpacity = isDarkMode ? 0.6 : 0.15;

  const startUploadBanner = () => {
    setUploadProgress((prev) => {
      if (prev && !prev.done && prev.source !== 'camera') return prev;
      return { current: 0, total: 1, done: false, source: 'camera' };
    });
  };

  const finishUploadBanner = () => {
    setUploadProgress((prev) => {
      if (prev && prev.source && prev.source !== 'camera') return prev;
      return { current: 1, total: 1, done: true, source: 'camera' };
    });
    setTimeout(() => {
      setUploadProgress((prev) => {
        if (prev && prev.source && prev.source !== 'camera') return prev;
        return null;
      });
    }, 1500);
  };

  const clearUploadBanner = () => {
    setUploadProgress((prev) => {
      if (prev && prev.source && prev.source !== 'camera') return prev;
      return null;
    });
  };

  const handleTakePhoto = async () => {
    try {
      startUploadBanner();
      const newPhoto = await takePhoto();
      if (!newPhoto || newPhoto.duplicate) {
        clearUploadBanner();
        return;
      }
      finishUploadBanner();
      toggleMenu();
      appendPhoto(newPhoto);
    } catch (e) {
      clearUploadBanner();
    }
  };

  const handleUploadPhoto = () => {
    toggleMenu();
    router.push('/upload');
  };

  const handleRegisterFace = () => {
    toggleMenu();
    router.push('/face');
  };

  const toggleMenu = () => {
    const toValue = menuVisible ? 0 : 1;
    if (!menuVisible) setMenuVisible(true);
    Animated.spring(menuAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      if (toValue === 0) setMenuVisible(false);
    });
  };

  const menuStyle = {
    opacity: menuAnim,
    transform: [
      { scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
      { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
    ],
  };

  const iconRotation = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const circleSize = size > 0 ? size : 72;

  return (
    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      {menuVisible && (
        <Animated.View
          style={[
            menuStyle,
            {
              position: 'absolute',
              bottom: circleSize + 8,
              right: 0,
              zIndex: 20,
              width: 192,
              borderRadius: 16,
              overflow: 'hidden',
            },
          ]}
          className={`border ${colors.menuBg} ${colors.menuBorder}`}
        >
          <Pressable
            onPress={handleTakePhoto}
            className={`flex-row items-center justify-between px-4 py-3 border-b ${colors.rowBorder} ${colors.rowActive}`}
          >
            <Text className={`text-base ${colors.text}`}>Take Photo</Text>
            <Ionicons name="camera-outline" size={20} color={colors.icon} />
          </Pressable>
          <Pressable
            onPress={handleUploadPhoto}
            className={`flex-row items-center justify-between px-4 py-3 border-b ${colors.rowBorder} ${colors.rowActive}`}
          >
            <Text className={`text-base ${colors.text}`}>Upload Photo</Text>
            <Ionicons name="image-outline" size={20} color={colors.icon} />
          </Pressable>
          <Pressable
            onPress={handleRegisterFace}
            className={`flex-row items-center justify-between px-4 py-3 ${colors.rowActive}`}
          >
            <Text className={`text-base ${colors.text}`}>Register Face</Text>
            <Ionicons name="people-outline" size={20} color={colors.icon} />
          </Pressable>
        </Animated.View>
      )}

      <Pressable
        onPress={toggleMenu}
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: circleBg,
          borderWidth: 1,
          borderColor: circleBorder,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
          <Ionicons name="add" size={32} color={iconColor} />
        </Animated.View>
      </Pressable>
    </View>
  );
}
