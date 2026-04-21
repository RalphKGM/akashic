import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME_OPTIONS } from '../theme/appColors.js';

export default function ThemeSwitch({ themeId, onChangeTheme, colors, isDarkMode }) {
  return (
    <View className={`px-4 py-4 ${colors.rowBg}`}>
      <View className="flex-row items-center mb-4">
        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${colors.iconBg}`}>
          <Ionicons name="color-palette-outline" size={18} color={colors.iconColor} />
        </View>
        <View className="flex-1">
          <Text className={`text-base font-semibold ${colors.textPrimary}`}>Theme</Text>
          <Text className={`text-xs mt-1 ${colors.textSecondary}`}>
            Choose a color mood for Akashic.
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
        {THEME_OPTIONS.map((theme) => {
          const active = theme.id === themeId;
          const activeBg = isDarkMode ? '#27272A' : '#FFFFFF';
          const inactiveBg = isDarkMode ? '#18181B' : '#F3F4F6';

          return (
            <Pressable
              key={theme.id}
              onPress={() => onChangeTheme(theme.id)}
              className="rounded-2xl p-3 mb-2"
              style={({ pressed }) => ({
                width: '50%',
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <View
                className="rounded-2xl p-3"
                style={{
                  minHeight: 108,
                  backgroundColor: active ? activeBg : inactiveBg,
                  borderWidth: 1.5,
                  borderColor: active ? colors.iconColor : isDarkMode ? '#3F3F46' : '#E5E7EB',
                }}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View
                    className="w-10 h-10 rounded-full overflow-hidden"
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
                  </View>
                  <Ionicons
                    name={active ? 'checkmark-circle' : theme.icon}
                    size={20}
                    color={active ? colors.iconColor : isDarkMode ? '#A1A1AA' : '#6B7280'}
                  />
                </View>

                <Text className={`text-sm font-semibold ${active ? colors.textPrimary : colors.textSecondary}`}>
                  {theme.label}
                </Text>
                <Text className={`text-[10px] leading-4 mt-1 ${colors.textSecondary}`} numberOfLines={2}>
                  {theme.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
