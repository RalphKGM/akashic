import Constants from 'expo-constants';

const getApiUrl = () => {
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, '');
  }

  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3000`;
    }
    return 'http://localhost:3000';
  }
  return 'https://akashic.up.railway.app';
};

export const API_URL = getApiUrl();
