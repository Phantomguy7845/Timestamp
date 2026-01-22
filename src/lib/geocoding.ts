const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

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

// Get current GPS position
export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
            },
            (err) => {
                reject(err);
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0,
            }
        );
    });
}
