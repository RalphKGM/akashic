import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verifyOtp, resendOtp } from '../../service/authService.js';
import { useThemeContext } from '../../context/ThemeContext.jsx';
import { getThemeColors } from '../../theme/appColors.js';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { email } = useLocalSearchParams();
  const { isDarkMode } = useThemeContext();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef([]);

  const dark = isDarkMode;
  const colors = getThemeColors(isDarkMode);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = (text, index) => {
    const cleaned = text.replace(/\D/g, '');

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, OTP_LENGTH).split('');
      const next = [...otp];
      chars.forEach((c, i) => { if (index + i < OTP_LENGTH) next[index + i] = c; });
      setOtp(next);
      const focusIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
      inputs.current[focusIndex]?.focus();
      return;
    }

    const next = [...otp];
    next[index] = cleaned;
    setOtp(next);
    if (cleaned && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length < OTP_LENGTH) {
      Alert.alert('Incomplete Code', 'Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, token);
      router.replace('(tabs)/library');
    } catch (err) {
      Alert.alert('Verification Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendOtp(email);
      setCooldown(60);
      Alert.alert('Code Sent', 'A new code has been sent to your email.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 justify-center items-center px-5 ${dark ? 'bg-zinc-900' : 'bg-gray-100'}`}
    >
      <View className={`w-full rounded-3xl border p-8 ${dark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>

        {/* Back button */}
        <Pressable onPress={() => router.back()} className="mb-6 self-start">
          <Ionicons name="arrow-back" size={24} color={dark ? '#fff' : '#18181b'} />
        </Pressable>

        {/* Icon */}
        <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-6 ${dark ? 'bg-zinc-700' : 'bg-gray-100'}`}>
          <Ionicons name="mail-unread-outline" size={28} color={dark ? '#a1a1aa' : '#6b7280'} />
        </View>

        {/* Header */}
        <Text className={`text-3xl font-bold mb-2 ${dark ? 'text-white' : 'text-zinc-900'}`}>
          Check your email
        </Text>
        <Text className={`text-base mb-2 ${dark ? 'text-zinc-400' : 'text-gray-500'}`}>
          We sent a 6-digit code to
        </Text>
        <Text className={`text-base font-semibold mb-10 ${dark ? 'text-white' : 'text-zinc-900'}`}>
          {email}
        </Text>

        {/* OTP Boxes */}
        <View className="flex-row justify-between mb-8">
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={ref => inputs.current[i] = ref}
              className={`w-[13%] aspect-square rounded-2xl text-center text-2xl font-bold border ${
                digit
                  ? dark ? 'bg-zinc-700 border-zinc-400 text-white' : 'bg-gray-100 border-zinc-700 text-zinc-900'
                  : dark ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-gray-100 border-gray-200 text-zinc-900'
              }`}
              value={digit}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <Pressable
          onPress={handleVerify}
          disabled={loading}
          className={`h-14 rounded-full items-center justify-center mb-8 ${dark ? 'bg-zinc-100' : 'bg-black'}`}
        >
          {({ pressed }) => (
            <Text className={`text-lg font-semibold ${dark ? 'text-zinc-900' : 'text-white'}`} style={{ opacity: pressed ? 0.7 : 1 }}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </Text>
          )}
        </Pressable>

        {/* Resend */}
        <View className="flex-row justify-center items-center">
          <Text className={`text-sm ${dark ? 'text-zinc-400' : 'text-gray-500'}`}>
            Didn't receive it?{' '}
          </Text>
          <Pressable onPress={handleResend} disabled={cooldown > 0}>
            <Text className={`text-sm font-semibold ${
              cooldown > 0
                ? dark ? 'text-zinc-600' : 'text-gray-300'
                : dark ? 'text-white' : 'text-zinc-900'
            }`}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </Text>
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}