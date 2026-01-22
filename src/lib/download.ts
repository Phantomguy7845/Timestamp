import type { Photo, Settings } from '../types';
import { renderPhotoToBlob } from './canvas';
import { generateFilename } from './format';

// Download single blob
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Delay helper
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Download one photo
export async function downloadOne(
    photo: Photo,
    settings: Settings,
    format: 'jpeg' | 'png',
    quality: number,
    index: number
): Promise<void> {
    const blob = await renderPhotoToBlob(photo, settings, format, quality);
    const filename = generateFilename(index, format);
    downloadBlob(blob, filename);
}

// Download all photos with 3-tier fallback
export async function downloadAll(
    photos: Photo[],
    settings: Settings,
    format: 'jpeg' | 'png',
    quality: number,
    onProgress: (current: number, total: number) => void
): Promise<{ method: string; success: boolean }> {
    const total = photos.length;
    if (total === 0) return { method: 'none', success: false };

    // Tier 1: File System Access API
    if ('showDirectoryPicker' in window) {
        try {
            const dirHandle = await (window as any).showDirectoryPicker({
                mode: 'readwrite',
            });

            for (let i = 0; i < total; i++) {
                const blob = await renderPhotoToBlob(photos[i], settings, format, quality);
                const filename = generateFilename(i, format);
                const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                onProgress(i + 1, total);
            }

            return { method: 'filesystem', success: true };
        } catch (e) {
            if ((e as Error).name === 'AbortError') {
                return { method: 'filesystem', success: false };
            }
            console.log('File System API failed, trying ZIP:', e);
            // Fall through to Tier 2
        }
    }

    // Tier 2: JSZip
    try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (let i = 0; i < total; i++) {
            const blob = await renderPhotoToBlob(photos[i], settings, format, quality);
            const filename = generateFilename(i, format);
            zip.file(filename, blob);
            onProgress(i + 1, total);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const now = new Date();
        const y = now.getFullYear();
        const mo = (now.getMonth() + 1).toString().padStart(2, '0');
        const d = now.getDate().toString().padStart(2, '0');
        downloadBlob(zipBlob, `Timestamp_${y}${mo}${d}.zip`);

        return { method: 'zip', success: true };
    } catch (e) {
        console.log('JSZip failed, trying sequential:', e);
        // Fall through to Tier 3
    }

    // Tier 3: Sequential downloads
    for (let i = 0; i < total; i++) {
        const blob = await renderPhotoToBlob(photos[i], settings, format, quality);
        const filename = generateFilename(i, format);
        downloadBlob(blob, filename);
        await delay(400);
        onProgress(i + 1, total);
    }

    return { method: 'sequential', success: true };
}
