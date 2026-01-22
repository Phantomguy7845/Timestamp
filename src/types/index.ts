// Photo record stored in IndexedDB
export interface PhotoRecord {
    id: string;
    baseBlob: Blob;
    width: number;
    height: number;
    createdAtISO: string;
    timeMode: 'now' | 'custom';
    timeValueISO: string;
    sourceName: string;
    fromFrontMirror: boolean;
}

// Runtime photo with object URL
export interface Photo extends PhotoRecord {
    thumbUrl: string;
}

// Preset size option
export interface PresetSize {
    label: string;
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
}

// App settings stored in localStorage
export interface Settings {
    // Time
    globalTimeMode: 'now' | 'custom';
    globalCustomTime: string;

    // Format
    timestampFormat: 'thai-verbose' | 'iso';

    // Output
    outputMode: 'original' | 'preset';
    presetSize: { w: number; h: number };
    presetOrientation: 'portrait' | 'landscape';
    fitMode: 'contain' | 'cover';

    // Overlay
    overlayPosition: 'TR' | 'TL' | 'BR' | 'BL';
    overlayPadding: number;
    fontMode: 'auto' | 'fixed';
    fontAutoScale: number;
    fontFixedPx: number;

    // Location
    locationEnabled: boolean;
    showLatLng: boolean;
    showAddress: boolean;
    latitude: number | null;
    longitude: number | null;
    cachedAddress: string | null;

    // Log
    showLog: boolean;
}

// Toast message
export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

// Camera status
export type CameraStatus = 'off' | 'starting' | 'ready' | 'error' | 'denied';

// Modal type
export type ModalType = 'none' | 'preview' | 'settings' | 'map';

// Download file type
export type DownloadFormat = 'jpeg' | 'png';
