import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signup } from '../../service/authService.js';
import { useThemeContext } from '../../context/ThemeContext.jsx';
import { getThemeColors } from '../../theme/appColors.js';

export default function Signup() {
  const { isDarkMode } = useThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const dark = isDarkMode;
  const colors = getThemeColors(isDarkMode);

  const validate = () => {
    if (!email.trim()) {
      Alert.alert('Signup Error', 'Email is required.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Signup Error', 'Please enter a valid email address.');
      return false;
    }

    if (!password) {
      Alert.alert('Signup Error', 'Password is required.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Signup Error', 'Password must be at least 6 characters.');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await signup(email, password);
      if (!data?.user?.identities?.length) {
        Alert.alert('Signup Failed', 'Email is already registered.');
        return;
      }
      router.replace({ pathname: '(auth)/otp', params: { email } });
    } catch (err) {
      Alert.alert('Signup Failed', err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 justify-center items-center px-5 ${dark ? 'bg-zinc-900' : 'bg-gray-100'}`}
    >
      <View className={`w-full rounded-3xl border p-8 ${dark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>

        {/* Header */}
        <Text className={`text-3xl font-bold mb-2 ${dark ? 'text-white' : 'text-zinc-900'}`}>
          Create Account
        </Text>
        <Text className={`text-base mb-10 ${dark ? 'text-zinc-400' : 'text-gray-500'}`}>
          Sign up to get started
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
        <View className={`flex-row items-center rounded-2xl mb-5 px-5 h-[60px] border ${dark ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-100 border-gray-200'}`}>
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

        {/* Sign Up Button */}
        <Pressable
          onPress={handleSignup}
          disabled={loading}
          className={`h-14 rounded-full items-center justify-center mb-8 ${dark ? 'bg-zinc-100' : 'bg-black'}`}
        >
          {({ pressed }) => (
            <Text className={`text-lg font-semibold ${dark ? 'text-zinc-900' : 'text-white'}`} style={{ opacity: pressed ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : 'Sign Up'}
            </Text>
          )}
        </Pressable>

        {/* Login Link */}
        <View className="flex-row justify-center items-center">
          <Text className={`text-sm ${dark ? 'text-zinc-400' : 'text-gray-500'}`}>
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('(auth)')}>
            <Text className={`text-sm font-semibold ${dark ? 'text-white' : 'text-zinc-900'}`}>
              Login
            </Text>
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
