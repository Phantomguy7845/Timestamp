import Dexie, { type EntityTable } from 'dexie';
import type { PhotoRecord } from '../types';

// Define database
const db = new Dexie('timestamp-photos') as Dexie & {
    photos: EntityTable<PhotoRecord, 'id'>;
};

db.version(1).stores({
    photos: 'id, createdAtISO',
});

export { db };

// Helper functions
export async function getAllPhotos(): Promise<PhotoRecord[]> {
    return db.photos.orderBy('createdAtISO').toArray();
}

export async function addPhoto(photo: PhotoRecord): Promise<void> {
    await db.photos.add(photo);
}

export async function updatePhoto(id: string, updates: Partial<PhotoRecord>): Promise<void> {
    await db.photos.update(id, updates);
}

export async function deletePhoto(id: string): Promise<void> {
    await db.photos.delete(id);
}

export async function deleteAllPhotos(): Promise<void> {
    await db.photos.clear();
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
    return db.photos.get(id);
}
