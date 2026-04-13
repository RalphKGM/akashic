import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const DEFAULT_PORT = 3000;

const extractHost = (value) => {
  if (!value || typeof value !== 'string') return null;

  const normalized = value
    .replace(/^exp:\/\/|^http:\/\/|^https:\/\//, '')
    .split('/')[0]
    .trim();

  const host = normalized.split(':')[0];
  return host || null;
};

const isPrivateIpv4Host = (host) =>
  /^10\./.test(host) ||
  /^192\.168\./.test(host) ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

const getExpoDevHost = () => {
  const candidates = [
    NativeModules?.SourceCode?.scriptURL,
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
    const isPrivateHost = isPrivateIpv4Host(url.hostname);
    const runtimeHost = getExpoDevHost();

    if (__DEV__ && runtimeHost && (isLoopbackHost || isPrivateHost) && runtimeHost !== url.hostname) {
      url.hostname = runtimeHost;
      return url.toString().replace(/\/$/, '');
    }

    if (!isLoopbackHost) {
      return value;
    }

    if (Platform.OS === 'android') {
      url.hostname = runtimeHost || '10.0.2.2';
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

    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${DEFAULT_PORT}`;
    }

    return 'http://localhost:3000';
  }
  return 'https://akashic.up.railway.app';
};

export const API_URL = getApiUrl();

if (__DEV__) {
  console.log(`[api] Using API_URL=${API_URL} (detectedHost=${getExpoDevHost() || 'none'})`);
}
