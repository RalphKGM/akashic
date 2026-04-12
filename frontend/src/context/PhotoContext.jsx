import { createContext, useContext, useState, useCallback } from 'react';

const PhotoContext = createContext();

export const PhotoProvider = ({ children }) => {
    const [photos, setPhotos] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(null);

    const appendPhoto = useCallback((newPhoto) => {
        setPhotos((prev) => [...prev, newPhoto]);
    }, []);

    const resetPhotos = useCallback(() => {
        setPhotos([]);
        setUploadProgress(null);
    }, []);

    return (
        <PhotoContext.Provider value={{ 
            photos, 
            setPhotos, 
            appendPhoto,
            resetPhotos,
            uploadProgress,
            setUploadProgress,
        }}>
            {children}
        </PhotoContext.Provider>
    );
};

export const usePhotoContext = () => useContext(PhotoContext);
