import type { Notification } from '@/types';
import { uid } from '@/utils/time';
import { db } from './collections';

export const notificationsService = {
  list: () => db.notifications.all(),
  push(input: Omit<Notification, 'id' | 'at' | 'read'>) {
    db.notifications.upsert({ ...input, id: uid('nt'), at: new Date().toISOString(), read: false });
  },
  markAllRead() {
    db.notifications.upsertMany(db.notifications.all().filter((n) => !n.read).map((n) => ({ ...n, read: true })));
  },
  markRead(id: string) {
    db.notifications.update(id, { read: true });
  },
};
