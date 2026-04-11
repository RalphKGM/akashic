import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../config/supabase';
import { useThemeContext } from '../../context/ThemeContext.jsx';
import { getThemeColors } from '../../theme/appColors.js';

const CACHE_KEY = 'photos_cache';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { isDarkMode, setIsDarkMode } = useThemeContext();
  const colors = getThemeColors(isDarkMode);
  const [autoBackup, setAutoBackup] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all locally cached photos. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(CACHE_KEY);
              Alert.alert('Cache cleared', 'Local photo cache has been deleted.');
            } catch (err) {
              Alert.alert('Error', 'Failed to clear cache.');
            }
          },
        },
      ]
    );
  };

  const SettingsSection = ({ title, children }) => (
    <View className="mb-6">
      <Text className={`text-xs font-semibold uppercase tracking-wide px-4 mb-3 ${colors.sectionTitle}`}>
        {title}
      </Text>
      <View className={`rounded-2xl mx-3 overflow-hidden ${colors.cardBg}`}>
        {children}
      </View>
    </View>
  );

  const SettingsRow = ({ icon, label, value, onPress, rightElement, isLast }) => (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between px-4 py-4 ${colors.rowBg} ${!isLast ? `border-b ${colors.divider}` : ''} ${colors.rowActive}`}
    >
      <View className="flex-row items-center flex-1">
        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${colors.iconBg}`}>
          <Ionicons name={icon} size={18} color={colors.iconColor} />
        </View>
        <Text className={`text-base font-medium ${colors.textPrimary}`}>{label}</Text>
      </View>
      {rightElement || (
        <View className="flex-row items-center">
          {value && <Text className={`mr-2 ${colors.textSecondary}`}>{value}</Text>}
          <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
        </View>
      )}
    </Pressable>
  );

  const ToggleRow = ({ icon, label, value, onValueChange, isLast }) => (
    <View className={`flex-row items-center justify-between px-4 py-4 ${colors.rowBg} ${!isLast ? `border-b ${colors.divider}` : ''}`}>
      <View className="flex-row items-center flex-1">
        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${colors.iconBg}`}>
          <Ionicons name={icon} size={18} color={colors.iconColor} />
        </View>
        <Text className={`text-base font-medium ${colors.textPrimary}`}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <View className={`flex-1 ${colors.pageBg}`}>
      {/* Header */}
      <View className={`pt-16 pb-6 px-4 border-b ${colors.headerBg} ${colors.border}`}>
        <Text className={`text-3xl font-extrabold tracking-tight ${colors.textPrimary}`}>
          Profile
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Account Card */}
        <View className={`mt-6 mx-3 rounded-2xl p-6 mb-6 ${colors.cardBg}`}>
          <View className="items-center">
            <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${colors.pickerCircle}`}>
              <Text className="text-3xl font-bold" style={{ color: colors.pickerCircleIcon }}>
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </Text>
            </View>
            <Text className={`text-sm ${colors.textSecondary}`}>{user?.email || 'user@example.com'}</Text>
          </View>
        </View>

        {/* Appearance */}
        <SettingsSection title="Appearance">
          <ToggleRow
            icon="moon"
            label="Dark Mode"
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            isLast
          />
        </SettingsSection>

        {/* Storage */}
        <SettingsSection title="Storage">
          <SettingsRow
            icon="trash-outline"
            label="Clear Cache"
            onPress={handleClearCache}
            isLast
          />
        </SettingsSection>
        {/* About */}
        <SettingsSection title="About">
          <SettingsRow
            icon="information-circle-outline"
            label="About"
            value="v1.0.0"
            onPress={() => {}}
            isLast
          />
        </SettingsSection>

        {/* Sign Out Button */}
        <View className="mx-3 mb-8">
          <Pressable onPress={handleSignOut} className="rounded-2xl px-4 py-4">
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text className="text-red-600 font-semibold text-base ml-2">Sign Out</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
