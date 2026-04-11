import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { getThemeColors } from '../theme/appColors.js';
import { registerFace, getKnownFaces, deleteFace } from '../service/faceService.js';
import { useThemeContext } from '../context/ThemeContext.jsx';

export default function FaceRegistration() {
  const router = useRouter();
  const { isDarkMode } = useThemeContext();
  const colors = getThemeColors(isDarkMode);

  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingUri, setPendingUri] = useState(null);
  const [nameInput, setNameInput] = useState('');

  const loadFaces = useCallback(async () => {
    try {
      const data = await getKnownFaces();
      setFaces(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFaces(); }, [loadFaces]);

  const handleAdd = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (result.canceled) return;
    setPendingUri(result.assets[0].uri);
    setNameInput('');
    setModalVisible(true);
  };

  const handleConfirmRegister = async () => {
    if (!nameInput.trim() || !pendingUri) return;
    setModalVisible(false);
    setRegistering(true);
    try {
      const face = await registerFace(nameInput.trim(), pendingUri);
      setFaces(prev => [...prev, face]);
      Alert.alert('Registered!', `${nameInput.trim()} has been registered. New photos with their face will be tagged automatically.`);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setRegistering(false);
      setPendingUri(null);
      setNameInput('');
    }
  };

  const handleDelete = (face) => {
    Alert.alert('Remove Face', `Remove ${face.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFace(face.id);
            setFaces(prev => prev.filter(f => f.id !== face.id));
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const renderFace = ({ item }) => (
    <View className={`mx-4 mt-3 rounded-2xl px-4 py-3 ${colors.cardBg}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${colors.iconBg}`}
          >
            <Text className={`text-base font-bold ${colors.textPrimary}`}>
              {item.name[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className={`text-base font-medium ${colors.textPrimary}`}>{item.name}</Text>
            <Text className={`text-xs mt-0.5 ${colors.textSecondary}`}>Registered</Text>
          </View>
        </View>
        <Pressable onPress={() => handleDelete(item)} className="p-1" hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color="#DC2626" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className={`flex-1 ${colors.pageBg}`}>
      {/* Header */}
      <View className={`flex-row items-center px-4 pt-16 pb-4 border-b ${colors.headerBg} ${colors.border}`}>
        <Pressable onPress={() => router.back()} className="mr-4" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </Pressable>
        <Text className={`text-2xl font-bold ${colors.headerText}`}>Face Recognition</Text>
        <Pressable onPress={handleAdd} disabled={registering} hitSlop={8} className="ml-auto">
          {registering ? (
            <ActivityIndicator size="small" color={colors.icon} />
          ) : (
            <Ionicons name="add" size={30} color={colors.icon} />
          )}
        </Pressable>
      </View>

      {/* Info banner */}
      <View className={`mx-4 mt-4 mb-2 px-4 py-3 rounded-xl flex-row items-start ${colors.cardBg}`}>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.infoIcon}
          style={{ marginTop: 1, marginRight: 8 }}
        />
        <Text className={`text-sm flex-1 leading-5 ${colors.infoText}`}>
          Registered faces are automatically tagged in new photos.
        </Text>
      </View>

      {/* Face list */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.loading} />
        </View>
      ) : faces.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="people-outline" size={56} color={colors.emptyIcon} />
          <Text className={`text-lg font-semibold mt-4 ${colors.textPrimary}`}>No faces yet</Text>
          <Text className={`text-sm text-center mt-2 ${colors.textSecondary}`}>
            Tap + to register someone's face
          </Text>
        </View>
      ) : (
        <FlatList
          data={faces}
          keyExtractor={item => item.id}
          renderItem={renderFace}
          contentContainerStyle={{ paddingVertical: 4, paddingBottom: 12 }}
        />
      )}

      {/* Name input modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center px-6"
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            onPress={() => {}}
            className={`rounded-2xl p-6 ${colors.sheetBg}`}
          >
            <Text className={`text-lg font-bold mb-1 ${colors.textPrimary}`}>Who is this?</Text>
            <Text className={`text-sm mb-4 ${colors.textSecondary}`}>
              Enter the name of the person in the photo
            </Text>
            <TextInput
              placeholder="e.g. Ralph"
              placeholderTextColor={colors.inputPlaceholder}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirmRegister}
              className={`rounded-xl px-4 py-3 mb-4 text-base border ${colors.inputBg} ${colors.inputBorder} ${colors.inputText}`}
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => { setModalVisible(false); setPendingUri(null); }}
                className={`flex-1 py-3 rounded-xl items-center ${colors.secondaryBtn}`}
              >
                <Text className={`font-semibold ${colors.secondaryText}`}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmRegister}
                disabled={!nameInput.trim()}
                className={`flex-1 py-3 rounded-xl items-center ${colors.button}`}
                style={{ opacity: nameInput.trim() ? 1 : 0.4 }}
              >
                <Text className="font-semibold text-white">Register</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
