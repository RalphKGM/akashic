import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../../service/authService.js';
import { useThemeContext } from '../../context/ThemeContext.jsx';
import { getThemeColors } from '../../theme/appColors.js';

export default function Login() {
  const { isDarkMode } = useThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const dark = isDarkMode;
  const colors = getThemeColors(isDarkMode);

  const validate = () => {
    if (!email.trim()) {
      Alert.alert('Login Error', 'Email is required.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Login Error', 'Please enter a valid email address.');
      return false;
    }

    if (!password) {
      Alert.alert('Login Error', 'Password is required.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Login Error', 'Password must be at least 6 characters.');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert('Login failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 justify-center items-center px-5 ${dark ? 'bg-zinc-900' : 'bg-gray-100'}`}
    >
      < View className={`w-full rounded-3xl border p-8 ${dark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>

        {/* Header */}
        <Text className={`text-3xl font-bold mb-2 ${dark ? 'text-white' : 'text-zinc-900'}`}>
          Welcome Back
        </Text>
        <Text className={`text-base mb-10 ${dark ? 'text-zinc-400' : 'text-gray-500'}`}>
          Login to continue
        </Text>

        {/* Email Input */}
        <View className={`flex-row items-center rounded-2xl mb-5 px-5 h-[60px] border ${dark ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-100 border-gray-200'}`}>
          <Ionicons name="mail-outline" size={20} color={dark ? '#a1a1aa' : '#9ca3af'} />
          <TextInput
            className={`flex-1 ml-3 text-base ${dark ? 'text-white' : 'text-zinc-900'}`}
            placeholder="Email"
            placeholderTextColor={dark ? '#71717a' : '#9ca3af'}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Password Input */}
        <View className={`flex-row items-center rounded-2xl mb-3 px-5 h-[60px] border ${dark ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-100 border-gray-200'}`}>
          <Ionicons name="lock-closed-outline" size={20} color={dark ? '#a1a1aa' : '#9ca3af'} />
          <TextInput
            className={`flex-1 ml-3 text-base ${dark ? 'text-white' : 'text-zinc-900'}`}
            placeholder="Password"
            placeholderTextColor={dark ? '#71717a' : '#9ca3af'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
          />
          <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} className="p-2">
            <Ionicons
              name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={dark ? '#a1a1aa' : '#9ca3af'}
            />
          </Pressable>
        </View>

        {/* Login Button */}
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className={`h-14 rounded-full items-center justify-center my-8 ${dark ? 'bg-zinc-100' : 'bg-black'}`}
        >
          {({ pressed }) => (
            <Text className={`text-lg font-semibold ${dark ? 'text-zinc-900' : 'text-white'}`} style={{ opacity: pressed ? 0.7 : 1 }}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          )}
        </Pressable>

        {/* Sign Up Link */}
        <View className="flex-row justify-center items-center">
          <Text className={`text-sm ${dark ? 'text-zinc-400' : 'text-gray-500'}`}>
            Don't have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/signup')}>
            <Text className={`text-sm font-semibold ${dark ? 'text-white' : 'text-zinc-900'}`}>
              Sign Up
            </Text>
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
