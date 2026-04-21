import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const THEMES = [
  {
    id: 'light',
    label: 'Light',
    description: 'Clean gallery mode',
    icon: 'sunny-outline',
    swatch: ['#F9FAFB', '#111827'],
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Midnight browsing',
    icon: 'moon-outline',
    swatch: ['#18181B', '#F8FAFC'],
  },
];

export default function ThemeSwitch({ isDarkMode, onChange, colors }) {
  const indicatorAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;
  const [switchWidth, setSwitchWidth] = useState(0);
  const activeThemeId = isDarkMode ? 'dark' : 'light';

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: isDarkMode ? 1 : 0,
      tension: 85,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, [indicatorAnim, isDarkMode]);

  const indicatorTranslate = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, (switchWidth - 8) / 2)],
  });

  return (
    <View className={`px-4 py-4 ${colors.rowBg}`}>
      <View className="flex-row items-center mb-4">
        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${colors.iconBg}`}>
          <Ionicons name="color-palette-outline" size={18} color={colors.iconColor} />
        </View>
        <View className="flex-1">
          <Text className={`text-base font-semibold ${colors.textPrimary}`}>Theme</Text>
          <Text className={`text-xs mt-1 ${colors.textSecondary}`}>
            Pick the look that fits your gallery.
          </Text>
        </View>
      </View>

      <View
        className={`relative flex-row rounded-2xl p-1 ${isDarkMode ? 'bg-zinc-900' : 'bg-gray-100'}`}
        onLayout={(event) => setSwitchWidth(event.nativeEvent.layout.width)}
        style={{ borderWidth: 1, borderColor: isDarkMode ? '#3F3F46' : '#E5E7EB' }}
      >
        {switchWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            className="absolute top-1 bottom-1 left-1 rounded-xl"
            style={{
              width: (switchWidth - 8) / 2,
              backgroundColor: isDarkMode ? '#27272A' : '#FFFFFF',
              transform: [{ translateX: indicatorTranslate }],
            }}
          />
        )}
        {THEMES.map((theme) => {
          const active = activeThemeId === theme.id;

          return (
            <Pressable
              key={theme.id}
              onPress={() => onChange(theme.id === 'dark')}
              className="flex-1 rounded-xl px-3 py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
            >
              <View className="flex-row items-center">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-2 overflow-hidden"
                  style={{
                    borderWidth: 1,
                    borderColor: active ? colors.iconColor : isDarkMode ? '#52525B' : '#D1D5DB',
                  }}
                >
                  <View className="absolute inset-0" style={{ backgroundColor: theme.swatch[0] }} />
                  <View
                    className="absolute right-0 top-0 bottom-0"
                    style={{ width: '50%', backgroundColor: theme.swatch[1] }}
                  />
                  <Ionicons
                    name={theme.icon}
                    size={15}
                    color={active ? colors.iconColor : isDarkMode ? '#A1A1AA' : '#6B7280'}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`text-sm font-semibold ${active ? colors.textPrimary : colors.textSecondary}`}>
                    {theme.label}
                  </Text>
                  <Text className={`text-[10px] mt-0.5 ${colors.textSecondary}`} numberOfLines={1}>
                    {theme.description}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
