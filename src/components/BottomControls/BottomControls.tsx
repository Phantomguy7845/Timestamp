import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useCamera } from '../../hooks/useCamera';
import { useCapture } from '../../hooks/useCapture';
import { formatTimeSummary, formatLocationSummary } from '../../lib/format';

export default function BottomControls() {
    const { state, dispatch, deletePhoto, deleteAllPhotos, openPreview, showToast } = useApp();
    const { videoRef, cameraOn, cameraStatus, hasMultipleCameras, switchCamera } = useCamera();
    const { capturePhoto, importPhotos } = useCapture();
    const galleryRef = useRef<HTMLDivElement>(null);

    const { photos, settings } = state;

    // Listen for import event
    useEffect(() => {
        const handleImport = async (e: Event) => {
            const files = (e as CustomEvent).detail as FileList;
            await importPhotos(files);
        };

        window.addEventListener('do-import', handleImport);
        return () => window.removeEventListener('do-import', handleImport);
    }, [importPhotos]);

    // Auto-scroll gallery to end when new photo added
    useEffect(() => {
        if (galleryRef.current && photos.length > 0) {
            galleryRef.current.scrollLeft = galleryRef.current.scrollWidth;
        }
    }, [photos.length]);

    const handleCapture = async () => {
        if (!videoRef.current || cameraStatus !== 'ready') return;
        await capturePhoto(videoRef.current);
    };

    const handleDeletePhoto = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deletePhoto(id);
        showToast('ลบรูปแล้ว', 'info');
    };

    const handleDeleteAll = async () => {
        if (photos.length === 0) return;
        if (!confirm(`ลบรูปทั้งหมด ${photos.length} รูป?`)) return;
        await deleteAllPhotos();
        showToast('ลบรูปทั้งหมดแล้ว', 'info');
    };

    const timeSummary = formatTimeSummary(settings.globalTimeMode, settings.globalCustomTime);
    const locationSummary = formatLocationSummary(
        settings.locationEnabled,
        settings.latitude,
        settings.longitude,
        settings.cachedAddress
    );

    const canCapture = cameraOn && cameraStatus === 'ready';
    const canSwitchCamera = cameraOn && hasMultipleCameras && cameraStatus === 'ready';

    return (
        <div className="bottom-controls">
            {/* Meta Bar */}
            <div className="meta-bar">
                <div className="meta-row">
                    <span className="meta-label">เวลา</span>
                    <span className="meta-value">{timeSummary}</span>
                    <button
                        className={`toggle meta-toggle ${settings.globalTimeMode === 'now' ? 'on' : ''}`}
                        onClick={() => {
                            dispatch({
                                type: 'SET_SETTINGS',
                                payload: {
                                    globalTimeMode: settings.globalTimeMode === 'now' ? 'custom' : 'now',
                                },
                            });
                        }}
                        title={settings.globalTimeMode === 'now' ? 'ใช้เวลาปัจจุบัน' : 'ใช้เวลากำหนดเอง'}
                    >
                        <span className="toggle-knob">
                            {settings.globalTimeMode === 'now' ? '⏱️' : '📅'}
                        </span>
                    </button>
                </div>

                {settings.globalTimeMode === 'custom' && (
                    <div className="meta-row">
                        <span className="meta-label"></span>
                        <input
                            type="datetime-local"
                            value={settings.globalCustomTime.slice(0, 16)}
                            onChange={(e) => {
                                dispatch({
                                    type: 'SET_SETTINGS',
                                    payload: { globalCustomTime: new Date(e.target.value).toISOString() },
                                });
                            }}
                            style={{ flex: 1 }}
                        />
                    </div>
                )}

                <div className="meta-row">
                    <span className="meta-label">ตำแหน่ง</span>
                    <span className="meta-value">{locationSummary}</span>
                    <span className="meta-pill">{photos.length} รูป</span>
                </div>
            </div>

            {/* Gallery Strip */}
            <div className="gallery-strip" ref={galleryRef}>
                {photos.map((photo, index) => (
                    <div
                        key={photo.id}
                        className="thumbnail"
                        onClick={() => openPreview(photo.id)}
                    >
                        <img src={photo.thumbUrl} alt={`Photo ${index + 1}`} />
                        <span className="thumbnail-badge">{index + 1}</span>
                        <button
                            className="thumbnail-delete"
                            onClick={(e) => handleDeletePhoto(e, photo.id)}
                            title="ลบรูปนี้"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
                <div className="action-btn-left">
                    <button
                        className="delete-all-btn"
                        onClick={handleDeleteAll}
                        disabled={photos.length === 0}
                    >
                        🗑️ ลบทั้งหมด
                    </button>
                </div>

                <button
                    className="shutter-btn"
                    onClick={handleCapture}
                    disabled={!canCapture}
                    title="ถ่ายรูป"
                />

                <div className="action-btn-right">
                    <button
                        className="switch-cam-btn"
                        onClick={switchCamera}
                        disabled={!canSwitchCamera}
                        title="สลับกล้อง"
                    >
                        🔄
                    </button>
                </div>
            </div>
        </div>
    );
}
