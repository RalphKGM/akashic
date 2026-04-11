import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'is_dark_mode_enabled';
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(value => {
        if (!isMounted) return;
        setIsDarkMode(value === 'true');
      })
      .finally(() => {
        if (isMounted) setIsThemeReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isThemeReady) return;
    AsyncStorage.setItem(THEME_STORAGE_KEY, String(isDarkMode));
  }, [isDarkMode, isThemeReady]);

  const value = useMemo(
    () => ({
      isDarkMode,
      setIsDarkMode,
      isThemeReady,
    }),
    [isDarkMode, isThemeReady]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useThemeContext = () => {
  return useContext(ThemeContext);
}
