import { Geolocation } from '@capacitor/geolocation';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Request location permission using Capacitor
export async function requestLocationPermission(): Promise<boolean> {
    try {
        const status = await Geolocation.checkPermissions();

        if (status.location === 'granted' || status.coarseLocation === 'granted') {
            return true;
        }

        if (status.location === 'prompt' || status.location === 'prompt-with-rationale') {
            const result = await Geolocation.requestPermissions({ permissions: ['location'] });
            return result.location === 'granted' || result.coarseLocation === 'granted';
        }

        return false;
    } catch (e) {
        console.error('Location permission check failed:', e);
        return false;
    }
}

// Reverse geocode: lat/lng -> address
export async function reverseGeocode(
    lat: number,
    lng: number
): Promise<string | null> {
    try {
        const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=th`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'TimestampApp/1.0',
            },
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.display_name || null;
    } catch (e) {
        console.error('Reverse geocode failed:', e);
        return null;
    }
}

// Forward geocode: search query -> lat/lng
export async function forwardGeocode(
    query: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
    try {
        const url = `${NOMINATIM_BASE}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1&accept-language=th`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'TimestampApp/1.0',
            },
        });

        if (!res.ok) return null;

        const data = await res.json();
        if (data.length === 0) return null;

        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            displayName: data[0].display_name,
        };
    } catch (e) {
        console.error('Forward geocode failed:', e);
        return null;
    }
}

// Get current GPS position using Capacitor Geolocation
export async function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    // Request permission first
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
        throw new Error('Location permission denied');
    }

    try {
        const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
        });

        return {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        };
    } catch (e) {
        console.error('Get position failed:', e);
        throw e;
    }
}
