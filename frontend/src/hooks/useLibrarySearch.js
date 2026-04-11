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

  const handleSearch = useCallback(async () => {
    try {
      setSearchLoading(true);
      setSearchError('');

      const assets = await searchPhoto(searchQuery);

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
    toggleSearch,
    titleOpacity,
    searchWidth,
    searchOpacity,
  };
};
