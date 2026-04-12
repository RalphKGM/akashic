import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../config/supabase.js';
import { PhotoProvider } from '../context/PhotoContext';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext.jsx';
import '../../global.css';

function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const segments = useSegments();
  const router = useRouter();
  const { isThemeReady } = useThemeContext();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoggedIn === null) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)/library');
    } else if (!isLoggedIn && !inAuthGroup) {
      router.replace('(auth)');
    }
  }, [isLoggedIn, segments]);

  if (isLoggedIn === null || !isThemeReady) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 600,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <PhotoProvider>
          <RootNavigator />
        </PhotoProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
