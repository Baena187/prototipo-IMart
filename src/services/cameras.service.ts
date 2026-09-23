import type { Camera, Gondola, Store, VisionEvent } from '@/types';
import { db } from './collections';
import { delay } from './db';

export interface CameraRow {
  camera: Camera;
  store: Store;
  gondola: Gondola;
  events: VisionEvent[];
}

export const camerasService = {
  list: () =>
    delay(
      db.cameras.all().map<CameraRow>((c) => ({
        camera: c,
        store: db.stores.get(c.storeId)!,
        gondola: db.gondolas.get(c.gondolaId)!,
        events: db.visionEvents.all().filter((e) => e.cameraId === c.id),
      })),
    ),
  events: () => delay(db.visionEvents.all().slice().sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))),
  resolveEvent(id: string) {
    db.visionEvents.update(id, { resolved: true });
  },
};
