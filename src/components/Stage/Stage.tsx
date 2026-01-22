import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useCamera } from '../../hooks/useCamera';
import { useCapture } from '../../hooks/useCapture';

export default function Stage() {
    const { state } = useApp();
    const { videoRef, cameraStatus, facingMode, cameraOn } = useCamera();
    const { updateViewfinderDimensions } = useCapture();
    const viewfinderRef = useRef<HTMLDivElement>(null);

    const { settings } = state;

    // Update viewfinder dimensions when size changes
    const updateDimensions = useCallback(() => {
        if (viewfinderRef.current) {
            const rect = viewfinderRef.current.getBoundingClientRect();
            updateViewfinderDimensions(rect.width, rect.height);
        }
    }, [updateViewfinderDimensions]);

    useEffect(() => {
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [updateDimensions]);

    // Calculate preset guide frame dimensions
    const presetGuide = useMemo(() => {
        if (settings.outputMode !== 'preset') return null;

        const { w, h } = settings.presetSize;
        return { w, h, ratio: w / h };
    }, [settings.outputMode, settings.presetSize]);

    // Listen for import event from Topbar
    useEffect(() => {
        const handleImport = async (e: Event) => {
            const files = (e as CustomEvent).detail as FileList;
            const importEvent = new CustomEvent('do-import', { detail: files });
            window.dispatchEvent(importEvent);
        };

        window.addEventListener('import-files', handleImport);
        return () => window.removeEventListener('import-files', handleImport);
    }, []);

    const getHintText = () => {
        if (!cameraOn) return 'กล้องปิดอยู่ — ยังนำเข้ารูปได้';
        switch (cameraStatus) {
            case 'starting':
                return 'กำลังเปิดกล้อง...';
            case 'denied':
                return 'กรุณาอนุญาตการใช้กล้อง';
            case 'error':
                return 'ไม่สามารถเปิดกล้องได้';
            default:
                return null;
        }
    };

    const hintText = getHintText();
    const showVideo = cameraOn && cameraStatus === 'ready';

    return (
        <main className="stage">
            <div className="viewfinder-container">
                <div
                    ref={viewfinderRef}
                    className={`viewfinder ${facingMode === 'user' ? 'front-camera' : ''}`}
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ display: showVideo ? 'block' : 'none' }}
                    />

                    {hintText && (
                        <div className="viewfinder-hint">
                            {hintText}
                        </div>
                    )}

                    {/* Preset Frame Guide */}
                    {presetGuide && showVideo && (
                        <PresetGuide ratio={presetGuide.ratio} width={presetGuide.w} height={presetGuide.h} />
                    )}
                </div>
            </div>
        </main>
    );
}

// Preset frame guide overlay
function PresetGuide({ ratio, width, height }: { ratio: number; width: number; height: number }) {
    return (
        <div className="preset-guide">
            <div
                className="preset-guide-frame"
                style={{
                    aspectRatio: `${width} / ${height}`,
                    width: ratio < 0.75 ? '60%' : 'auto',
                    height: ratio >= 0.75 ? '80%' : 'auto',
                }}
            >
                <span className="preset-guide-label">
                    Preset: {width}×{height}
                </span>
            </div>
        </div>
    );
}
