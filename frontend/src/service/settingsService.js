import AsyncStorage from '@react-native-async-storage/async-storage';

const UPLOAD_SETTINGS_KEY = 'upload_settings';

export const DEFAULT_UPLOAD_SETTINGS = {
  showRecentSuggestions: true,
  autoSelectRecentSuggestions: false,
};

export const getUploadSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(UPLOAD_SETTINGS_KEY);
    if (!raw) return DEFAULT_UPLOAD_SETTINGS;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_UPLOAD_SETTINGS;
    }

    return {
      ...DEFAULT_UPLOAD_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.log('getUploadSettings failed:', error?.message);
    return DEFAULT_UPLOAD_SETTINGS;
  }
};

export const updateUploadSettings = async (updates) => {
  const next = {
    ...(await getUploadSettings()),
    ...(updates || {}),
  };

  await AsyncStorage.setItem(UPLOAD_SETTINGS_KEY, JSON.stringify(next));
  return next;
};
