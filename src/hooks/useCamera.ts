import { useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { log } from '../lib/logger';

export function useCamera() {
    const { state, dispatch, showToast } = useApp();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const { cameraOn, facingMode, torchOn, cameraStatus } = state;

    // Start camera
    const startCamera = useCallback(async () => {
        if (!videoRef.current) return;

        dispatch({ type: 'SET_CAMERA_STATUS', payload: 'starting' });
        log(`Starting camera: ${facingMode}`);

        try {
            // Stop existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });

            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            // Check for torch capability
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
            const hasTorch = capabilities?.torch === true;
            dispatch({ type: 'SET_HAS_TORCH', payload: hasTorch });

            // Check for multiple cameras
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((d) => d.kind === 'videoinput');
            dispatch({ type: 'SET_HAS_MULTIPLE_CAMERAS', payload: videoInputs.length > 1 });

            dispatch({ type: 'SET_CAMERA_STATUS', payload: 'ready' });
            log('Camera ready');
        } catch (e) {
            const err = e as Error;
            log(`Camera error: ${err.message}`, 'error');

            if (err.name === 'NotAllowedError') {
                dispatch({ type: 'SET_CAMERA_STATUS', payload: 'denied' });
                showToast('กรุณาอนุญาตการใช้กล้อง', 'error');
            } else {
                dispatch({ type: 'SET_CAMERA_STATUS', payload: 'error' });
                showToast('เปิดกล้องไม่สำเร็จ', 'error');
            }
        }
    }, [facingMode, dispatch, showToast]);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        dispatch({ type: 'SET_CAMERA_STATUS', payload: 'off' });
        dispatch({ type: 'SET_TORCH_ON', payload: false });
        log('Camera stopped');
    }, [dispatch]);

    // Toggle camera on/off
    useEffect(() => {
        if (cameraOn) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, [cameraOn, startCamera, stopCamera]);

    // Switch facing mode
    const switchCamera = useCallback(() => {
        const newMode = facingMode === 'environment' ? 'user' : 'environment';
        dispatch({ type: 'SET_FACING_MODE', payload: newMode });
        dispatch({ type: 'SET_TORCH_ON', payload: false });
    }, [facingMode, dispatch]);

    // Toggle torch
    const toggleTorch = useCallback(async () => {
        if (!streamRef.current) return;

        const track = streamRef.current.getVideoTracks()[0];
        if (!track) return;

        const newTorchState = !torchOn;

        try {
            await track.applyConstraints({
                advanced: [{ torch: newTorchState } as MediaTrackConstraintSet],
            });
            dispatch({ type: 'SET_TORCH_ON', payload: newTorchState });
            log(`Torch ${newTorchState ? 'on' : 'off'}`);
        } catch (e) {
            log(`Torch toggle failed: ${e}`, 'error');
            showToast('ไม่สามารถเปิด/ปิดแฟลชได้', 'error');
        }
    }, [torchOn, dispatch, showToast]);

    // Toggle camera on/off
    const toggleCameraOn = useCallback(() => {
        dispatch({ type: 'SET_CAMERA_ON', payload: !cameraOn });
    }, [cameraOn, dispatch]);

    return {
        videoRef,
        cameraOn,
        cameraStatus,
        facingMode,
        torchOn,
        hasMultipleCameras: state.hasMultipleCameras,
        hasTorch: state.hasTorch,
        toggleCameraOn,
        switchCamera,
        toggleTorch,
        startCamera,
        stopCamera,
    };
}
