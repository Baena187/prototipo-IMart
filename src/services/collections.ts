import { alertsSeed, visionSeedsResolved } from '@/data/alerts';
import { auditSeed } from '@/data/audit';
import { campaignsSeed } from '@/data/campaigns';
import { notificationsSeed, settingsSeed } from '@/data/misc';
import { buildNetwork } from '@/data/network';
import { pricesSeed } from '@/data/prices';
import { productsSeed } from '@/data/products';
import { storesSeed } from '@/data/stores';
import { ticketsSeed } from '@/data/tickets';
import { usersSeed } from '@/data/users';
import type {
  Alert,
  AuditEvent,
  Camera,
  Campaign,
  Device,
  Gondola,
  Notification,
  PriceChange,
  Product,
  Shelf,
  Store,
  StorePrice,
  Ticket,
  User,
  VisionEvent,
} from '@/types';
import { Collection, SingleDoc } from './db';

export const db = {
  stores: new Collection<Store>('stores', storesSeed),
  products: new Collection<Product>('products', productsSeed),
  gondolas: new Collection<Gondola>('gondolas', () => buildNetwork().gondolas),
  shelves: new Collection<Shelf>('shelves', () => buildNetwork().shelves),
  cameras: new Collection<Camera>('cameras', () => buildNetwork().cameras),
  devices: new Collection<Device>('devices', () => buildNetwork().devices),
  visionEvents: new Collection<VisionEvent>('visionEvents', () => {
    const cams = buildNetwork().cameras;
    return visionSeedsResolved().flatMap(({ cameraCode, event }) => {
      const cam = cams.find((c) => c.code === cameraCode) ?? cams[0];
      return [{ ...event, cameraId: cam.id, storeId: cam.storeId, gondolaId: cam.gondolaId }];
    });
  }),
  alerts: new Collection<Alert>('alerts', alertsSeed),
  campaigns: new Collection<Campaign>('campaigns', campaignsSeed),
  prices: new Collection<PriceChange>('prices', pricesSeed),
  storePrices: new Collection<StorePrice>('storePrices', () => []),
  tickets: new Collection<Ticket>('tickets', ticketsSeed),
  users: new Collection<User>('users', usersSeed),
  audit: new Collection<AuditEvent>('audit', auditSeed),
  notifications: new Collection<Notification>('notifications', notificationsSeed),
  settings: new SingleDoc('settings', settingsSeed),
};

export type CollectionName = keyof typeof db;
