import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PORT = 3000;
const LOCAL_LAN_FALLBACK_IP = '192.168.100.122';

const extractHost = (value) => {
  if (!value || typeof value !== 'string') return null;

  const normalized = value
    .replace(/^exp:\/\/|^http:\/\/|^https:\/\//, '')
    .split('/')[0]
    .trim();

  const host = normalized.split(':')[0];
  return host || null;
};

const getExpoDevHost = () => {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.manifest2?.extra?.expoClient?.hostUri,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    Constants.manifest?.debuggerHost,
    Constants.manifest?.hostUri,
  ];

  for (const candidate of candidates) {
    const host = extractHost(candidate);
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  return null;
};

const normalizeLocalDevUrl = (value) => {
  if (!value) return value;

  try {
    const url = new URL(value);
    const isLoopbackHost =
      url.hostname === '127.0.0.1' || url.hostname === 'localhost';

    if (!isLoopbackHost) {
      return value;
    }

    if (Platform.OS === 'android') {
      url.hostname = getExpoDevHost() || LOCAL_LAN_FALLBACK_IP || '10.0.2.2';
      return url.toString().replace(/\/$/, '');
    }

    return value.replace(/\/$/, '');
  } catch {
    return value.replace(/\/$/, '');
  }
};

const getApiUrl = () => {
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicitUrl) {
    return normalizeLocalDevUrl(explicitUrl);
  }

  if (__DEV__) {
    const host = getExpoDevHost();
    if (host) {
      return `http://${host}:${DEFAULT_PORT}`;
    }

    if (Platform.OS === 'android' && LOCAL_LAN_FALLBACK_IP) {
      return `http://${LOCAL_LAN_FALLBACK_IP}:${DEFAULT_PORT}`;
    }

    return 'http://localhost:3000';
  }
  return 'https://akashic.up.railway.app';
};

export const API_URL = getApiUrl();

if (__DEV__) {
  console.log(`[api] Using API_URL=${API_URL}`);
}
