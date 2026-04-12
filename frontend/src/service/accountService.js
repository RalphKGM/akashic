import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSession, logout } from './authService.js';
import { API_URL } from '../config/api.js';

const CACHE_KEY = 'photos_cache';

export const deleteAccount = async () => {
  const token = await getSession();
  const response = await fetch(`${API_URL}/api/account`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to delete account');
  }

  await AsyncStorage.removeItem(CACHE_KEY);

  try {
    await logout();
  } catch {
    // The auth record may already be deleted server-side.
  }

  return data;
};
