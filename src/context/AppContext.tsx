import { createContext, useContext, useReducer, useEffect, type ReactNode, useCallback, useRef } from 'react';
import type { Photo, Settings, ToastMessage, CameraStatus, ModalType, PhotoRecord } from '../types';
import { loadSettings, saveSettings, DEFAULT_SETTINGS, resetSettings as resetSettingsStorage } from '../lib/settings';
import { getAllPhotos, addPhoto as addPhotoDB, deletePhoto as deletePhotoDB, deleteAllPhotos as deleteAllPhotosDB, updatePhoto as updatePhotoDB } from '../lib/db';
import { generateId } from '../lib/format';
import { log } from '../lib/logger';

// State
interface AppState {
    // Camera
    cameraOn: boolean;
    facingMode: 'environment' | 'user';
    torchOn: boolean;
    hasMultipleCameras: boolean;
    hasTorch: boolean;
    cameraStatus: CameraStatus;

    // Photos
    photos: Photo[];

    // Settings
    settings: Settings;

    // Modals
    activeModal: ModalType;
    previewPhotoId: string | null;

    // Toast
    toasts: ToastMessage[];

    // Download progress
    downloadProgress: { current: number; total: number } | null;
}

// Actions
type Action =
    | { type: 'SET_CAMERA_ON'; payload: boolean }
    | { type: 'SET_FACING_MODE'; payload: 'environment' | 'user' }
    | { type: 'SET_TORCH_ON'; payload: boolean }
    | { type: 'SET_HAS_MULTIPLE_CAMERAS'; payload: boolean }
    | { type: 'SET_HAS_TORCH'; payload: boolean }
    | { type: 'SET_CAMERA_STATUS'; payload: CameraStatus }
    | { type: 'SET_PHOTOS'; payload: Photo[] }
    | { type: 'ADD_PHOTO'; payload: Photo }
    | { type: 'UPDATE_PHOTO'; payload: { id: string; updates: Partial<Photo> } }
    | { type: 'DELETE_PHOTO'; payload: string }
    | { type: 'DELETE_ALL_PHOTOS' }
    | { type: 'SET_SETTINGS'; payload: Partial<Settings> }
    | { type: 'RESET_SETTINGS' }
    | { type: 'SET_ACTIVE_MODAL'; payload: ModalType }
    | { type: 'SET_PREVIEW_PHOTO_ID'; payload: string | null }
    | { type: 'ADD_TOAST'; payload: ToastMessage }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'SET_DOWNLOAD_PROGRESS'; payload: { current: number; total: number } | null };

// Initial state
const initialState: AppState = {
    cameraOn: true,
    facingMode: 'environment',
    torchOn: false,
    hasMultipleCameras: false,
    hasTorch: false,
    cameraStatus: 'off',
    photos: [],
    settings: loadSettings(),
    activeModal: 'none',
    previewPhotoId: null,
    toasts: [],
    downloadProgress: null,
};

// Reducer
function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_CAMERA_ON':
            return { ...state, cameraOn: action.payload };
        case 'SET_FACING_MODE':
            return { ...state, facingMode: action.payload };
        case 'SET_TORCH_ON':
            return { ...state, torchOn: action.payload };
        case 'SET_HAS_MULTIPLE_CAMERAS':
            return { ...state, hasMultipleCameras: action.payload };
        case 'SET_HAS_TORCH':
            return { ...state, hasTorch: action.payload };
        case 'SET_CAMERA_STATUS':
            return { ...state, cameraStatus: action.payload };
        case 'SET_PHOTOS':
            return { ...state, photos: action.payload };
        case 'ADD_PHOTO':
            return { ...state, photos: [...state.photos, action.payload] };
        case 'UPDATE_PHOTO':
            return {
                ...state,
                photos: state.photos.map((p) =>
                    p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
                ),
            };
        case 'DELETE_PHOTO':
            return {
                ...state,
                photos: state.photos.filter((p) => p.id !== action.payload),
            };
        case 'DELETE_ALL_PHOTOS':
            return { ...state, photos: [] };
        case 'SET_SETTINGS': {
            const newSettings = { ...state.settings, ...action.payload };
            saveSettings(newSettings);
            return { ...state, settings: newSettings };
        }
        case 'RESET_SETTINGS':
            resetSettingsStorage();
            return { ...state, settings: { ...DEFAULT_SETTINGS } };
        case 'SET_ACTIVE_MODAL':
            return { ...state, activeModal: action.payload };
        case 'SET_PREVIEW_PHOTO_ID':
            return { ...state, previewPhotoId: action.payload };
        case 'ADD_TOAST':
            return { ...state, toasts: [...state.toasts, action.payload] };
        case 'REMOVE_TOAST':
            return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
        case 'SET_DOWNLOAD_PROGRESS':
            return { ...state, downloadProgress: action.payload };
        default:
            return state;
    }
}

// Context
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    // Helper functions
    addPhoto: (record: PhotoRecord) => Promise<void>;
    updatePhoto: (id: string, updates: Partial<PhotoRecord>) => Promise<void>;
    deletePhoto: (id: string) => Promise<void>;
    deleteAllPhotos: () => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    openPreview: (photoId: string) => void;
    closeModal: () => void;
    videoRef: React.RefObject<HTMLVideoElement>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const objectUrlsRef = useRef<Map<string, string>>(new Map());
    const videoRef = useRef<HTMLVideoElement>(null);

    // Load photos from IndexedDB on mount
    useEffect(() => {
        async function loadPhotos() {
            try {
                const records = await getAllPhotos();
                const photos: Photo[] = records.map((r) => {
                    const thumbUrl = URL.createObjectURL(r.baseBlob);
                    objectUrlsRef.current.set(r.id, thumbUrl);
                    return { ...r, thumbUrl };
                });
                dispatch({ type: 'SET_PHOTOS', payload: photos });
                log(`Loaded ${photos.length} photos from storage`);
            } catch (e) {
                log(`Failed to load photos: ${e}`, 'error');
            }
        }
        loadPhotos();

        // Cleanup on unmount
        return () => {
            objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    // Add photo
    const addPhoto = useCallback(async (record: PhotoRecord) => {
        await addPhotoDB(record);
        const thumbUrl = URL.createObjectURL(record.baseBlob);
        objectUrlsRef.current.set(record.id, thumbUrl);
        dispatch({ type: 'ADD_PHOTO', payload: { ...record, thumbUrl } });
        log(`Photo added: ${record.id}`);
    }, []);

    // Update photo
    const updatePhoto = useCallback(async (id: string, updates: Partial<PhotoRecord>) => {
        await updatePhotoDB(id, updates);
        dispatch({ type: 'UPDATE_PHOTO', payload: { id, updates } });
    }, []);

    // Delete photo
    const deletePhoto = useCallback(async (id: string) => {
        const url = objectUrlsRef.current.get(id);
        if (url) {
            URL.revokeObjectURL(url);
            objectUrlsRef.current.delete(id);
        }
        await deletePhotoDB(id);
        dispatch({ type: 'DELETE_PHOTO', payload: id });
        log(`Photo deleted: ${id}`);
    }, []);

    // Delete all photos
    const deleteAllPhotos = useCallback(async () => {
        objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        objectUrlsRef.current.clear();
        await deleteAllPhotosDB();
        dispatch({ type: 'DELETE_ALL_PHOTOS' });
        log('All photos deleted');
    }, []);

    // Show toast
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = generateId();
        dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
        setTimeout(() => {
            dispatch({ type: 'REMOVE_TOAST', payload: id });
        }, 3000);
    }, []);

    // Open preview
    const openPreview = useCallback((photoId: string) => {
        dispatch({ type: 'SET_PREVIEW_PHOTO_ID', payload: photoId });
        dispatch({ type: 'SET_ACTIVE_MODAL', payload: 'preview' });
    }, []);

    // Close modal
    const closeModal = useCallback(() => {
        dispatch({ type: 'SET_ACTIVE_MODAL', payload: 'none' });
        dispatch({ type: 'SET_PREVIEW_PHOTO_ID', payload: null });
    }, []);

    return (
        <AppContext.Provider
            value={{
                state,
                dispatch,
                addPhoto,
                updatePhoto,
                deletePhoto,
                deleteAllPhotos,
                showToast,
                openPreview,
                closeModal,
                videoRef,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
