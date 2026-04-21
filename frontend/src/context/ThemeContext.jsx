import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_THEME_ID, isDarkTheme, isThemeId } from '../theme/appColors.js';

const THEME_STORAGE_KEY = 'is_dark_mode_enabled';
const THEME_ID_STORAGE_KEY = 'theme_id';
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeIdState] = useState(DEFAULT_THEME_ID);
  const [isThemeReady, setIsThemeReady] = useState(false);
  const isDarkMode = isDarkTheme(themeId);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      AsyncStorage.getItem(THEME_ID_STORAGE_KEY),
      AsyncStorage.getItem(THEME_STORAGE_KEY),
    ])
      .then(([storedThemeId, legacyDarkMode]) => {
        if (!isMounted) return;

        if (isThemeId(storedThemeId)) {
          setThemeIdState(storedThemeId);
          return;
        }

        setThemeIdState(legacyDarkMode === 'true' ? 'dark' : DEFAULT_THEME_ID);
      })
      .finally(() => {
        if (isMounted) setIsThemeReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeId = useCallback((nextThemeId) => {
    if (!isThemeId(nextThemeId)) return;
    setThemeIdState(nextThemeId);
  }, []);

  const setIsDarkMode = useCallback((nextValue) => {
    setThemeIdState(nextValue ? 'dark' : DEFAULT_THEME_ID);
  }, []);

  useEffect(() => {
    if (!isThemeReady) return;
    AsyncStorage.setItem(THEME_ID_STORAGE_KEY, themeId);
    AsyncStorage.setItem(THEME_STORAGE_KEY, String(isDarkMode));
  }, [isDarkMode, isThemeReady, themeId]);

  const value = useMemo(
    () => ({
      themeId,
      setThemeId,
      isDarkMode,
      setIsDarkMode,
      isThemeReady,
    }),
    [isDarkMode, isThemeReady, setIsDarkMode, setThemeId, themeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useThemeContext = () => {
  return useContext(ThemeContext);
}
