import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN = Dimensions.get('window');
const MENU_WIDTH = Math.min(280, SCREEN.width - 24);
const ROW_HEIGHT = 52;

const getMenuPosition = (anchorRect, itemCount) => {
  const estimatedHeight = 16 + itemCount * ROW_HEIGHT;
  const centerX = (anchorRect?.x || 0) + (anchorRect?.width || 0) / 2;
  const left = Math.min(
    SCREEN.width - MENU_WIDTH - 12,
    Math.max(12, centerX - MENU_WIDTH / 2)
  );

  const preferredTop = (anchorRect?.y || 0) + (anchorRect?.height || 0) + 10;
  const fallbackTop = Math.max(18, (anchorRect?.y || 0) - estimatedHeight - 10);
  const fitsBelow = preferredTop + estimatedHeight < SCREEN.height - 24;
  const top = fitsBelow ? preferredTop : fallbackTop;

  return { top, left };
};

function MenuRow({ icon, label, destructive = false, onPress, divider = false, tintColor, textColor, dividerColor }) {
  return (
    <>
      <Pressable
        onPress={onPress}
        className="flex-row items-center px-4"
        style={{ height: ROW_HEIGHT }}
      >
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? '#EF4444' : tintColor}
          style={{ marginRight: 14 }}
        />
        <Text
          className="text-[17px]"
          style={{ color: destructive ? '#EF4444' : textColor }}
        >
          {label}
        </Text>
      </Pressable>
      {divider && (
        <View
          style={{ height: 1, backgroundColor: dividerColor, marginHorizontal: 14 }}
        />
      )}
    </>
  );
}

export default function PhotoContextMenu({
  visible,
  anchorRect,
  isDarkMode,
  actions,
  onClose,
}) {
  const [rendered, setRendered] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  const palette = useMemo(
    () => ({
      backdrop: isDarkMode ? 'rgba(0,0,0,0.42)' : 'rgba(15,23,42,0.18)',
      card: isDarkMode ? 'rgba(34,34,38,0.92)' : 'rgba(255,255,255,0.88)',
      border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
      shadow: isDarkMode ? '#000000' : '#64748B',
      text: isDarkMode ? '#F4F4F5' : '#111827',
      icon: isDarkMode ? '#F4F4F5' : '#111827',
      divider: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
    }),
    [isDarkMode]
  );

  const position = getMenuPosition(anchorRect, actions.length);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 72,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 6,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setRendered(false);
    });
  }, [opacity, scale, translateY, visible]);

  if (!rendered) return null;

  return (
    <Modal transparent visible={rendered} animationType="none" onRequestClose={onClose}>
      <View className="flex-1">
        <Animated.View className="absolute inset-0" style={{ opacity }}>
          <Pressable
            className="flex-1"
            onPress={onClose}
            style={{ backgroundColor: palette.backdrop }}
          />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            width: MENU_WIDTH,
            opacity,
            transform: [{ scale }, { translateY }],
            shadowColor: palette.shadow,
            shadowOpacity: 0.18,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 10 },
            elevation: 10,
          }}
        >
          <View
            className="overflow-hidden rounded-[26px]"
            style={{
              backgroundColor: palette.card,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            {actions.map((action, index) => (
              <MenuRow
                key={action.key}
                icon={action.icon}
                label={action.label}
                destructive={action.destructive}
                onPress={action.onPress}
                divider={index < actions.length - 1}
                tintColor={palette.icon}
                textColor={palette.text}
                dividerColor={palette.divider}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
