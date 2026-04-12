import { useCallback, useRef, useState } from 'react';
import { Animated, Keyboard } from 'react-native';
import { searchPhoto } from '../service/photoService.js';

export const useLibrarySearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [filteredPhotos, setFilteredPhotos] = useState(null);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const performSearch = useCallback(async (nextQuery = searchQuery) => {
    const query = String(nextQuery || '').trim();
    if (!query) {
      setFilteredPhotos([]);
      setSearchError('');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError('');

      const assets = await searchPhoto(query);

      const sorted = assets
        .filter(Boolean)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setFilteredPhotos(sorted);
    } catch (e) {
      setFilteredPhotos(null);
      setSearchError(e.message || 'Search failed');
      console.error('Search error', e);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const handleSearch = useCallback(async () => {
    await performSearch(searchQuery);
  }, [performSearch, searchQuery]);

  const openSearch = useCallback(() => {
    if (isSearching) return;

    setIsSearching(true);
    Animated.timing(searchAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isSearching, searchAnim]);

  const openSearchWithQuery = useCallback(async (query) => {
    const nextQuery = String(query || '').trim();
    if (!nextQuery) return;

    if (!isSearching) {
      setIsSearching(true);
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }

    setSearchQuery(nextQuery);
    await performSearch(nextQuery);
  }, [isSearching, performSearch, searchAnim]);

  const toggleSearch = useCallback((isSelectionMode) => {
    if (isSelectionMode) return;

    const toValue = isSearching ? 0 : 1;
    if (!isSearching) setIsSearching(true);

    Animated.timing(searchAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      if (toValue === 0) {
        setIsSearching(false);
        setSearchQuery('');
        setFilteredPhotos(null);
        setSearchError('');
        Keyboard.dismiss();
      }
    });
  }, [isSearching, searchAnim]);

  const titleOpacity = searchAnim.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0] });
  const searchWidth = searchAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '78%'] });
  const searchOpacity = searchAnim.interpolate({ inputRange: [0.2, 1], outputRange: [0, 1] });

  return {
    isSearching,
    searchQuery,
    setSearchQuery,
    searchLoading,
    searchError,
    filteredPhotos,
    setFilteredPhotos,
    handleSearch,
    openSearch,
    openSearchWithQuery,
    toggleSearch,
    titleOpacity,
    searchWidth,
    searchOpacity,
  };
};
