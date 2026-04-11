import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRef, useState } from 'react';
import { useThemeContext } from '../../context/ThemeContext.jsx';
import FloatingMenu from '../../components/FloatingMenu.jsx';

function FloatingTabBar({ state, descriptors, navigation, isDarkMode }) {
  const insets = useSafeAreaInsets();
  const menuAnim = useRef(new Animated.Value(0)).current;
  const [pillHeight, setPillHeight] = useState(0);

  const icons = {
    library: { focused: 'images',  outline: 'images-outline'  },
    albums:  { focused: 'albums',  outline: 'albums-outline'  },
    profile: { focused: 'person',  outline: 'person-outline'  },
  };

  const pillBg      = isDarkMode ? 'bg-[#1C1C1E]' : 'bg-white';
  const pillBorder  = isDarkMode ? 'border-[#3A3A3C]' : 'border-[#D1D1D6]';
  const activeTabBg = isDarkMode ? 'bg-[#2C2C2E]' : 'bg-zinc-200';
  const inactiveColor = isDarkMode ? '#A1A1AA' : '#71717A';
  const activeColor   = isDarkMode ? '#FFFFFF'  : '#000000';

  return (
    <View
      className="absolute left-4 right-4 flex-row items-center"
      style={{ bottom: insets.bottom + 10, gap: 10 }}
    >
      {/* Tab pill */}
      <View
        onLayout={(e) => setPillHeight(e.nativeEvent.layout.height)}
        className={`flex-1 flex-row items-center justify-around rounded-full border px-2 py-2 ${pillBg} ${pillBorder}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.6 : 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconSet   = icons[route.name] ?? { focused: 'ellipse', outline: 'ellipse-outline' };
          const rawLabel  = descriptors[route.key].options.tabBarLabel ?? route.name;
          const labelStr  =
            typeof rawLabel === 'string'
              ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
              : route.name.charAt(0).toUpperCase() + route.name.slice(1);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.75}
              className={`flex-1 items-center justify-center py-1.5 px-1 rounded-full ${
                isFocused ? activeTabBg : ''
              }`}
            >
              <Ionicons
                name={isFocused ? iconSet.focused : iconSet.outline}
                size={22}
                color={isFocused ? activeColor : inactiveColor}
              />
              <Text
                className="text-xs font-semibold mt-0.5"
                style={{ color: isFocused ? activeColor : inactiveColor }}
              >
                {labelStr}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* FAB circle */}
      <FloatingMenu
        menuAnim={menuAnim}
        isDarkMode={isDarkMode}
        size={pillHeight}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { isDarkMode } = useThemeContext();

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} isDarkMode={isDarkMode} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="library" options={{ tabBarLabel: 'Library' }} />
        <Tabs.Screen name="albums"  options={{ tabBarLabel: 'Albums'  }} />
        <Tabs.Screen name="profile" options={{ tabBarLabel: 'Profile' }} />
      </Tabs>
    </>
  );
}