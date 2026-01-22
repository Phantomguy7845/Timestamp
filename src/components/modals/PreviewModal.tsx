import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { renderPhotoToCanvas } from '../../lib/canvas';
import { downloadOne } from '../../lib/download';
import type { DownloadFormat } from '../../types';

export default function PreviewModal() {
    const { state, closeModal, updatePhoto, deletePhoto, showToast } = useApp();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [previewInfo, setPreviewInfo] = useState('');
    const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('jpeg');
    const [jpegQuality, setJpegQuality] = useState(0.92);
    const [isDownloading, setIsDownloading] = useState(false);

    const photo = state.photos.find((p) => p.id === state.previewPhotoId);

    // Render preview
    const renderPreview = useCallback(async () => {
        if (!photo || !canvasRef.current) return;

        try {
            const canvas = await renderPhotoToCanvas(photo, state.settings, 600);
            const ctx = canvasRef.current.getContext('2d')!;

            canvasRef.current.width = canvas.width;
            canvasRef.current.height = canvas.height;
            ctx.drawImage(canvas, 0, 0);

            // Calculate line count
            let lineCount = 2; // Network + Local
            if (state.settings.locationEnabled) {
                if (state.settings.showLatLng && state.settings.latitude !== null) lineCount++;
                if (state.settings.showAddress && state.settings.cachedAddress) lineCount++;
            }

            const outputW = state.settings.outputMode === 'original' ? photo.width : state.settings.presetSize.w;
            const outputH = state.settings.outputMode === 'original' ? photo.height : state.settings.presetSize.h;

            setPreviewInfo(`Preview: ${outputW}×${outputH} • Overlay ${lineCount} บรรทัด`);
        } catch (e) {
            console.error('Preview render failed:', e);
        }
    }, [photo, state.settings]);

    useEffect(() => {
        renderPreview();
    }, [renderPreview]);

    if (!photo) return null;

    const handleTimeNow = async () => {
        const now = new Date().toISOString();
        await updatePhoto(photo.id, { timeMode: 'now', timeValueISO: now });
        showToast('ตั้งเวลาปัจจุบันแล้ว', 'success');
    };

    const handleTimeCustom = async (value: string) => {
        const iso = new Date(value).toISOString();
        await updatePhoto(photo.id, { timeMode: 'custom', timeValueISO: iso });
    };

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);

        try {
            const index = state.photos.findIndex((p) => p.id === photo.id);
            await downloadOne(photo, state.settings, downloadFormat, jpegQuality, index);
            showToast('ดาวน์โหลดแล้ว', 'success');
        } catch (e) {
            showToast('ดาวน์โหลดไม่สำเร็จ', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async () => {
        await deletePhoto(photo.id);
        closeModal();
        showToast('ลบรูปแล้ว', 'info');
    };

    const timeValue = photo.timeValueISO.slice(0, 16);

    return (
        <div className="modal-backdrop preview-modal" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>พรีวิวรูป</h2>
                    <button className="icon-btn" onClick={closeModal}>✕</button>
                </div>

                <div className="preview-canvas-container">
                    <canvas ref={canvasRef} />
                </div>

                <div className="preview-info">{previewInfo}</div>

                <div className="preview-controls">
                    {/* Time settings for this photo */}
                    <div className="preview-section">
                        <h4>เวลาสำหรับรูปนี้</h4>
                        <div className="preview-time-buttons">
                            <button
                                className={`btn btn-sm ${photo.timeMode === 'now' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={handleTimeNow}
                            >
                                ⏱️ ใช้เวลาปัจจุบัน
                            </button>
                            <input
                                type="datetime-local"
                                value={timeValue}
                                onChange={(e) => handleTimeCustom(e.target.value)}
                                style={{ flex: 1 }}
                            />
                        </div>
                    </div>

                    {/* Download format */}
                    <div className="preview-section">
                        <h4>รูปแบบไฟล์</h4>
                        <div className="preview-format-row">
                            <select
                                value={downloadFormat}
                                onChange={(e) => setDownloadFormat(e.target.value as DownloadFormat)}
                            >
                                <option value="jpeg">JPEG</option>
                                <option value="png">PNG</option>
                            </select>

                            {downloadFormat === 'jpeg' && (
                                <>
                                    <label>คุณภาพ:</label>
                                    <input
                                        type="range"
                                        min="0.7"
                                        max="1"
                                        step="0.01"
                                        value={jpegQuality}
                                        onChange={(e) => setJpegQuality(parseFloat(e.target.value))}
                                        style={{ width: 100 }}
                                    />
                                    <span>{Math.round(jpegQuality * 100)}%</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="preview-actions">
                    <button
                        className="btn btn-primary"
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? '⏳ กำลังดาวน์โหลด...' : '💾 ดาวน์โหลด'}
                    </button>
                    <button className="btn btn-danger" onClick={handleDelete}>
                        🗑️ ลบรูปนี้
                    </button>
                </div>
            </div>
        </div>
    );
}
