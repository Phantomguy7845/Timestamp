import { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useCamera } from '../../hooks/useCamera';
import { downloadAll } from '../../lib/download';
import { log } from '../../lib/logger';

export default function Topbar() {
    const { state, dispatch, showToast } = useApp();
    const { cameraOn, toggleCameraOn, torchOn, toggleTorch, hasTorch, cameraStatus } = useCamera();
    const importRef = useRef<HTMLInputElement>(null);

    const handleImport = () => {
        importRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Import is handled by useCapture hook in BottomControls
        // We dispatch an event or call context method
        const event = new CustomEvent('import-files', { detail: files });
        window.dispatchEvent(event);

        e.target.value = '';
    };

    const handleDownloadAll = async () => {
        if (state.photos.length === 0) return;

        log('Starting download all');
        dispatch({ type: 'SET_DOWNLOAD_PROGRESS', payload: { current: 0, total: state.photos.length } });

        try {
            const result = await downloadAll(
                state.photos,
                state.settings,
                'jpeg',
                0.92,
                (current, total) => {
                    dispatch({ type: 'SET_DOWNLOAD_PROGRESS', payload: { current, total } });
                }
            );

            dispatch({ type: 'SET_DOWNLOAD_PROGRESS', payload: null });

            if (result.success) {
                showToast(`ดาวน์โหลดสำเร็จ (${result.method})`, 'success');
                log(`Download all completed: ${result.method}`);
            }
        } catch (e) {
            dispatch({ type: 'SET_DOWNLOAD_PROGRESS', payload: null });
            log(`Download all failed: ${e}`, 'error');
            showToast('ดาวน์โหลดไม่สำเร็จ', 'error');
        }
    };

    const handleSettings = () => {
        dispatch({ type: 'SET_ACTIVE_MODAL', payload: 'settings' });
    };

    const isCameraReady = cameraStatus === 'ready';
    const canUseTorch = hasTorch && isCameraReady && cameraOn;

    return (
        <header className="topbar">
            <div className="topbar-left">
                {/* Camera Toggle */}
                <button
                    className={`camera-toggle ${cameraOn ? 'on' : ''}`}
                    onClick={toggleCameraOn}
                    title={cameraOn ? 'ปิดกล้อง' : 'เปิดกล้อง'}
                >
                    <span className="camera-toggle-knob">
                        {cameraOn ? '📷' : '🚫'}
                    </span>
                </button>
            </div>

            <div className="topbar-center">
                Timestamp
            </div>

            <div className="topbar-right">
                {/* Torch */}
                <button
                    className={`icon-btn ${torchOn ? 'active' : ''}`}
                    onClick={toggleTorch}
                    disabled={!canUseTorch}
                    title="แฟลช"
                >
                    {torchOn ? '🔦' : '💡'}
                </button>

                {/* Import */}
                <button
                    className="icon-btn"
                    onClick={handleImport}
                    title="นำเข้ารูป"
                >
                    📥
                </button>
                <input
                    ref={importRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                {/* Download All */}
                <button
                    className="icon-btn"
                    onClick={handleDownloadAll}
                    disabled={state.photos.length === 0 || state.downloadProgress !== null}
                    title="ดาวน์โหลดทั้งหมด"
                >
                    {state.downloadProgress ? '⏳' : '💾'}
                </button>

                {/* Settings */}
                <button
                    className="icon-btn"
                    onClick={handleSettings}
                    title="ตั้งค่า"
                >
                    ⚙️
                </button>
            </div>
        </header>
    );
}
