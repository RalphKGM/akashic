import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { PhotoRecord, UploadProgress } from '../types/photo';

type PhotoContextValue = {
  photos: PhotoRecord[];
  setPhotos: Dispatch<SetStateAction<PhotoRecord[]>>;
  appendPhoto: (newPhoto: PhotoRecord) => void;
  resetPhotos: () => void;
  uploadProgress: UploadProgress | null;
  setUploadProgress: Dispatch<SetStateAction<UploadProgress | null>>;
};

const PhotoContext = createContext<PhotoContextValue | undefined>(undefined);

export const PhotoProvider = ({ children }: { children: ReactNode }) => {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const appendPhoto = useCallback((newPhoto: PhotoRecord) => {
    setPhotos((prev) => [...prev, newPhoto]);
  }, []);

  const resetPhotos = useCallback(() => {
    setPhotos([]);
    setUploadProgress(null);
  }, []);

  const value = useMemo(
    () => ({
      photos,
      setPhotos,
      appendPhoto,
      resetPhotos,
      uploadProgress,
      setUploadProgress,
    }),
    [appendPhoto, photos, resetPhotos, uploadProgress]
  );

  return <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>;
};

export const usePhotoContext = () => {
  const value = useContext(PhotoContext);

  if (!value) {
    throw new Error('usePhotoContext must be used within PhotoProvider');
  }

  return value;
};
