import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PRESET_SIZES, resetSettings } from '../../lib/settings';
import { getCurrentPosition, reverseGeocode, forwardGeocode } from '../../lib/geocoding';
import { getLogs, clearLogs, copyLogs, subscribeToLogs } from '../../lib/logger';
import type { PresetSize } from '../../types';

export default function SettingsModal() {
    const { state, dispatch, closeModal, deleteAllPhotos, showToast } = useApp();
    const { settings, photos } = state;

    const [logs, setLogs] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [locStatus, setLocStatus] = useState('');
    const [isLoadingGPS, setIsLoadingGPS] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Subscribe to logs
    useEffect(() => {
        setLogs(getLogs());
        const unsubscribe = subscribeToLogs(setLogs);
        return unsubscribe;
    }, []);

    // Update address when lat/lng changes and showAddress is on
    useEffect(() => {
        if (settings.locationEnabled && settings.showAddress && settings.latitude !== null && settings.longitude !== null) {
            if (!settings.cachedAddress) {
                fetchAddress(settings.latitude, settings.longitude);
            }
        }
    }, [settings.locationEnabled, settings.showAddress, settings.latitude, settings.longitude]);

    const fetchAddress = async (lat: number, lng: number) => {
        setLocStatus('กำลังหาที่อยู่...');
        const address = await reverseGeocode(lat, lng);
        if (address) {
            dispatch({ type: 'SET_SETTINGS', payload: { cachedAddress: address } });
            setLocStatus('');
        } else {
            setLocStatus('ไม่พบที่อยู่');
        }
    };

    const handleGetGPS = async () => {
        setIsLoadingGPS(true);
        setLocStatus('กำลังหาตำแหน่ง GPS...');
        try {
            const pos = await getCurrentPosition();
            dispatch({
                type: 'SET_SETTINGS',
                payload: {
                    latitude: pos.lat,
                    longitude: pos.lng,
                    cachedAddress: null,
                },
            });
            setLocStatus(`พบตำแหน่ง: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
            showToast('ได้ตำแหน่ง GPS แล้ว', 'success');
        } catch (e) {
            setLocStatus(`ไม่สามารถหาตำแหน่ง: ${(e as Error).message}`);
            showToast('หาตำแหน่ง GPS ไม่ได้', 'error');
        } finally {
            setIsLoadingGPS(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setLocStatus('กำลังค้นหา...');
        try {
            const result = await forwardGeocode(searchQuery);
            if (result) {
                dispatch({
                    type: 'SET_SETTINGS',
                    payload: {
                        latitude: result.lat,
                        longitude: result.lng,
                        cachedAddress: result.displayName,
                    },
                });
                setLocStatus('พบตำแหน่ง');
                showToast('พบตำแหน่งแล้ว', 'success');
            } else {
                setLocStatus('ไม่พบผลลัพธ์');
            }
        } catch (e) {
            setLocStatus('ค้นหาไม่สำเร็จ');
        } finally {
            setIsSearching(false);
        }
    };

    const handleOpenMap = () => {
        dispatch({ type: 'SET_ACTIVE_MODAL', payload: 'map' });
    };

    const handleResetSettings = () => {
        if (!confirm('รีเซ็ตการตั้งค่าทั้งหมด?')) return;
        resetSettings();
        dispatch({ type: 'RESET_SETTINGS' });
        showToast('รีเซ็ตการตั้งค่าแล้ว', 'info');
    };

    const handleDeleteAllPhotos = async () => {
        if (photos.length === 0) return;
        if (!confirm(`ลบรูปทั้งหมด ${photos.length} รูป?`)) return;
        await deleteAllPhotos();
        showToast('ลบรูปทั้งหมดแล้ว', 'info');
    };

    const handleCopyLogs = async () => {
        await copyLogs();
        showToast('คัดลอก log แล้ว', 'success');
    };

    // Group presets by orientation
    const portraitPresets = PRESET_SIZES.filter((p) => p.orientation === 'portrait');
    const landscapePresets = PRESET_SIZES.filter((p) => p.orientation === 'landscape');

    const currentPreset = PRESET_SIZES.find(
        (p) => p.width === settings.presetSize.w && p.height === settings.presetSize.h
    );

    const handlePresetChange = (preset: PresetSize) => {
        dispatch({
            type: 'SET_SETTINGS',
            payload: {
                presetSize: { w: preset.width, h: preset.height },
                presetOrientation: preset.orientation,
            },
        });
    };

    return (
        <div className="modal-backdrop settings-modal" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>⚙️ ตั้งค่า</h2>
                    <button className="icon-btn" onClick={closeModal}>✕</button>
                </div>

                <div className="modal-body">
                    {/* Time Section */}
                    <div className="settings-section">
                        <h3>🕐 เวลา (Global)</h3>
                        <div className="settings-row">
                            <label>ใช้เวลาปัจจุบัน</label>
                            <button
                                className={`toggle ${settings.globalTimeMode === 'now' ? 'on' : ''}`}
                                onClick={() => {
                                    dispatch({
                                        type: 'SET_SETTINGS',
                                        payload: { globalTimeMode: settings.globalTimeMode === 'now' ? 'custom' : 'now' },
                                    });
                                }}
                            >
                                <span className="toggle-knob">{settings.globalTimeMode === 'now' ? '✓' : '✕'}</span>
                            </button>
                        </div>

                        {settings.globalTimeMode === 'custom' && (
                            <div className="settings-row">
                                <label>เวลากำหนดเอง</label>
                                <input
                                    type="datetime-local"
                                    value={settings.globalCustomTime.slice(0, 16)}
                                    onChange={(e) => {
                                        dispatch({
                                            type: 'SET_SETTINGS',
                                            payload: { globalCustomTime: new Date(e.target.value).toISOString() },
                                        });
                                    }}
                                />
                            </div>
                        )}

                        <p className="settings-note">
                            {settings.globalTimeMode === 'now'
                                ? 'รูปใหม่จะล็อก timestamp ตอนถ่าย/นำเข้า'
                                : 'รูปใหม่จะใช้เวลาที่กำหนด'}
                        </p>
                    </div>

                    {/* Format Section */}
                    <div className="settings-section">
                        <h3>📝 รูปแบบ Timestamp</h3>
                        <div className="settings-row">
                            <label>รูปแบบ</label>
                            <select
                                value={settings.timestampFormat}
                                onChange={(e) => {
                                    dispatch({
                                        type: 'SET_SETTINGS',
                                        payload: { timestampFormat: e.target.value as 'thai-verbose' | 'iso' },
                                    });
                                }}
                            >
                                <option value="thai-verbose">ไทยแบบยาว + GMT+07:00</option>
                                <option value="iso">YYYY-MM-DD HH:mm:ss</option>
                            </select>
                        </div>
                        <p className="settings-note">Overlay จะแสดง 2 บรรทัด: Network และ Local</p>
                    </div>

                    {/* Output Section */}
                    <div className="settings-section">
                        <h3>📐 Output & ขนาด</h3>
                        <div className="settings-row">
                            <label>โหมด Output</label>
                            <select
                                value={settings.outputMode}
                                onChange={(e) => {
                                    dispatch({
                                        type: 'SET_SETTINGS',
                                        payload: { outputMode: e.target.value as 'original' | 'preset' },
                                    });
                                }}
                            >
                                <option value="original">Original (ขนาดเดิม)</option>
                                <option value="preset">Preset (กำหนดขนาด)</option>
                            </select>
                        </div>

                        {settings.outputMode === 'preset' && (
                            <>
                                <div className="settings-row">
                                    <label>มุมมอง</label>
                                    <select
                                        value={settings.presetOrientation}
                                        onChange={(e) => {
                                            const orientation = e.target.value as 'portrait' | 'landscape';
                                            const presets = orientation === 'portrait' ? portraitPresets : landscapePresets;
                                            if (presets.length > 0) {
                                                handlePresetChange(presets[0]);
                                            }
                                        }}
                                    >
                                        <option value="portrait">แนวตั้ง (Portrait)</option>
                                        <option value="landscape">แนวนอน (Landscape)</option>
                                    </select>
                                </div>

                                <div className="settings-row">
                                    <label>ขนาด Preset</label>
                                    <select
                                        value={currentPreset?.label || ''}
                                        onChange={(e) => {
                                            const preset = PRESET_SIZES.find((p) => p.label === e.target.value);
                                            if (preset) handlePresetChange(preset);
                                        }}
                                    >
                                        {(settings.presetOrientation === 'portrait' ? portraitPresets : landscapePresets).map((p) => (
                                            <option key={p.label} value={p.label}>
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="settings-row">
                                    <label>Fit Mode</label>
                                    <select
                                        value={settings.fitMode}
                                        onChange={(e) => {
                                            dispatch({
                                                type: 'SET_SETTINGS',
                                                payload: { fitMode: e.target.value as 'contain' | 'cover' },
                                            });
                                        }}
                                    >
                                        <option value="cover">Cover (ครอปเต็มเฟรม)</option>
                                        <option value="contain">Contain (มีขอบดำ)</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Overlay Section */}
                    <div className="settings-section">
                        <h3>🏷️ Overlay</h3>
                        <div className="settings-row">
                            <label>ตำแหน่ง</label>
                            <select
                                value={settings.overlayPosition}
                                onChange={(e) => {
                                    dispatch({
                                        type: 'SET_SETTINGS',
                                        payload: { overlayPosition: e.target.value as 'TR' | 'TL' | 'BR' | 'BL' },
                                    });
                                }}
                            >
                                <option value="BL">ล่างซ้าย (BL)</option>
                                <option value="BR">ล่างขวา (BR)</option>
                                <option value="TL">บนซ้าย (TL)</option>
                                <option value="TR">บนขวา (TR)</option>
                            </select>
                        </div>

                        <div className="settings-row">
                            <label>Padding (px)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={settings.overlayPadding}
                                onChange={(e) => {
                                    dispatch({
                                        type: 'SET_SETTINGS',
                                        payload: { overlayPadding: parseInt(e.target.value) || 0 },
                                    });
                                }}
                            />
                        </div>

                        <div className="settings-row">
                            <label>ขนาดตัวอักษร</label>
                            <select
                                value={settings.fontMode}
                                onChange={(e) => {
                                    dispatch({
                                        type: 'SET_SETTINGS',
                                        payload: { fontMode: e.target.value as 'auto' | 'fixed' },
                                    });
                                }}
                            >
                                <option value="auto">Auto (ตาม output)</option>
                                <option value="fixed">Fixed (กำหนดเอง)</option>
                            </select>
                        </div>

                        {settings.fontMode === 'auto' ? (
                            <div className="settings-row">
                                <label>Scale</label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={settings.fontAutoScale}
                                    onChange={(e) => {
                                        dispatch({
                                            type: 'SET_SETTINGS',
                                            payload: { fontAutoScale: parseFloat(e.target.value) },
                                        });
                                    }}
                                    style={{ width: 100 }}
                                />
                                <span>{Math.round(settings.fontAutoScale * 100)}%</span>
                            </div>
                        ) : (
                            <div className="settings-row">
                                <label>ขนาด (px)</label>
                                <input
                                    type="number"
                                    min="12"
                                    max="72"
                                    value={settings.fontFixedPx}
                                    onChange={(e) => {
                                        dispatch({
                                            type: 'SET_SETTINGS',
                                            payload: { fontFixedPx: parseInt(e.target.value) || 24 },
                                        });
                                    }}
                                />
                            </div>
                        )}

                        <p className="settings-note">Overlay ใช้ stroke + shadow (ไม่มีแถบพื้นดำ)</p>
                    </div>

                    {/* Location Section */}
                    <div className="settings-section">
                        <h3>📍 ตำแหน่ง</h3>
                        <div className="settings-row">
                            <label>เปิดใช้งานตำแหน่ง</label>
                            <button
                                className={`toggle ${settings.locationEnabled ? 'on' : ''}`}
                                onClick={() => {
                                    dispatch({
                                        type: 'SET_SETTINGS',
                                        payload: { locationEnabled: !settings.locationEnabled },
                                    });
                                }}
                            >
                                <span className="toggle-knob">{settings.locationEnabled ? '✓' : '✕'}</span>
                            </button>
                        </div>

                        {settings.locationEnabled && (
                            <>
                                <div className="settings-row">
                                    <label>แสดง Lat/Lng</label>
                                    <button
                                        className={`toggle ${settings.showLatLng ? 'on' : ''}`}
                                        onClick={() => {
                                            dispatch({
                                                type: 'SET_SETTINGS',
                                                payload: { showLatLng: !settings.showLatLng },
                                            });
                                        }}
                                    >
                                        <span className="toggle-knob">{settings.showLatLng ? '✓' : '✕'}</span>
                                    </button>
                                </div>

                                <div className="settings-row">
                                    <label>แสดงที่อยู่</label>
                                    <button
                                        className={`toggle ${settings.showAddress ? 'on' : ''}`}
                                        onClick={() => {
                                            dispatch({
                                                type: 'SET_SETTINGS',
                                                payload: { showAddress: !settings.showAddress },
                                            });
                                        }}
                                    >
                                        <span className="toggle-knob">{settings.showAddress ? '✓' : '✕'}</span>
                                    </button>
                                </div>

                                <div className="settings-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={handleGetGPS}
                                        disabled={isLoadingGPS}
                                    >
                                        {isLoadingGPS ? '⏳' : '📡'} GPS ปัจจุบัน
                                    </button>
                                    <button className="btn btn-sm btn-secondary" onClick={handleOpenMap}>
                                        🗺️ เลือกบนแผนที่
                                    </button>
                                </div>

                                <div className="settings-row">
                                    <label>Lat</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={settings.latitude ?? ''}
                                        onChange={(e) => {
                                            const val = e.target.value ? parseFloat(e.target.value) : null;
                                            dispatch({
                                                type: 'SET_SETTINGS',
                                                payload: { latitude: val, cachedAddress: null },
                                            });
                                        }}
                                        placeholder="ละติจูด"
                                    />
                                </div>

                                <div className="settings-row">
                                    <label>Lng</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={settings.longitude ?? ''}
                                        onChange={(e) => {
                                            const val = e.target.value ? parseFloat(e.target.value) : null;
                                            dispatch({
                                                type: 'SET_SETTINGS',
                                                payload: { longitude: val, cachedAddress: null },
                                            });
                                        }}
                                        placeholder="ลองจิจูด"
                                    />
                                </div>

                                <div className="settings-row">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="ค้นหาสถานที่..."
                                        style={{ flex: 1 }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                    >
                                        {isSearching ? '⏳' : '🔍'}
                                    </button>
                                </div>

                                {locStatus && <p className="settings-note">{locStatus}</p>}
                                {settings.cachedAddress && (
                                    <p className="settings-note" style={{ color: 'var(--accent)' }}>
                                        📍 {settings.cachedAddress}
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Log Section */}
                    <div className="settings-section">
                        <h3>📋 Log</h3>
                        <div className="settings-row">
                            <label>แสดง Log</label>
                            <button
                                className={`toggle ${settings.showLog ? 'on' : ''}`}
                                onClick={() => {
                                    dispatch({
                                        type: 'SET_SETTINGS',
                                        payload: { showLog: !settings.showLog },
                                    });
                                }}
                            >
                                <span className="toggle-knob">{settings.showLog ? '✓' : '✕'}</span>
                            </button>
                        </div>

                        {settings.showLog && (
                            <>
                                <div className="settings-row">
                                    <button className="btn btn-sm btn-secondary" onClick={handleCopyLogs}>
                                        📋 Copy Log
                                    </button>
                                    <button className="btn btn-sm btn-secondary" onClick={clearLogs}>
                                        🗑️ Clear Log
                                    </button>
                                </div>
                                <div className="log-panel">
                                    <pre>{logs.join('\n') || 'No logs yet'}</pre>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Danger Zone */}
                    <div className="settings-section danger-zone">
                        <h3>⚠️ Danger Zone</h3>
                        <div className="settings-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            <button className="btn btn-sm btn-outline" onClick={handleResetSettings}>
                                🔄 Reset Settings
                            </button>
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={handleDeleteAllPhotos}
                                disabled={photos.length === 0}
                            >
                                🗑️ ลบรูปทั้งหมด ({photos.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
