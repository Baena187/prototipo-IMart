import { DeviceStatus, DeviceType, type Device } from '@/types';
import { AuditAction } from '@/types';
import { auditService } from './audit.service';
import { db } from './collections';
import { delay } from './db';
import { currentActor, firstName } from './session';

export interface DeviceRow extends Device {
  storeName: string;
  link?: string;
}

function shelfDevices(): DeviceRow[] {
  return db.shelves.all().map((s) => {
    const g = db.gondolas.get(s.gondolaId);
    const store = db.stores.get(s.storeId);
    const seed = s.level * 7 + (g?.aisleNumber ?? 1) * 3;
    return {
      id: s.id,
      code: s.code,
      type: DeviceType.Regua,
      storeId: s.storeId,
      gondolaId: s.gondolaId,
      location: `${g?.code} · Prateleira ${s.level} · ${g?.aisle}`,
      status: s.status,
      ip: s.ip,
      firmware: s.firmware,
      temperatureC: s.status === DeviceStatus.Offline ? 0 : 31 + (seed % 9),
      signalDbm: s.status === DeviceStatus.Offline ? -99 : -(44 + (seed % 20)),
      uptimeHours: s.status === DeviceStatus.Offline ? 0 : 120 + seed * 11,
      lastHeartbeatAt: s.lastHeartbeatAt,
      lastPublishAt: s.lastPublishAt,
      model: 'iMart LED Strip LS-1500',
      storeName: store?.name ?? '',
      link: `/reguas/${s.id}/editor`,
    };
  });
}

function cameraDevices(): DeviceRow[] {
  return db.cameras.all().map((c, i) => ({
    id: c.id,
    code: c.code,
    type: DeviceType.Camera,
    storeId: c.storeId,
    gondolaId: c.gondolaId,
    location: `${db.gondolas.get(c.gondolaId)?.code} · ${c.aisle}`,
    status: c.status,
    ip: `10.${10 + Number(c.storeId.slice(2))}.5.${(i % 250) + 2}`,
    firmware: 'cam-5.7.3',
    temperatureC: c.status === DeviceStatus.Offline ? 0 : 38 + (i % 8),
    signalDbm: c.status === DeviceStatus.Offline ? -99 : -(40 + (i % 15)),
    uptimeHours: c.status === DeviceStatus.Offline ? 0 : 300 + i * 13,
    lastHeartbeatAt: c.lastProcessedAt,
    lastPublishAt: undefined,
    model: c.model,
    storeName: db.stores.get(c.storeId)?.name ?? '',
    link: '/cameras',
  }));
}

export function allDevices(): DeviceRow[] {
  const infra = db.devices.all().map((d) => ({ ...d, storeName: db.stores.get(d.storeId)?.name ?? '' }));
  return [...infra, ...shelfDevices(), ...cameraDevices()];
}

export interface MonitoringKpis {
  availability: number;
  shelvesOnline: number;
  shelvesTotal: number;
  camerasOnline: number;
  camerasTotal: number;
  controllersOnline: number;
  controllersTotal: number;
  gatewaysOnline: number;
  gatewaysTotal: number;
  problems: number;
}

export function monitoringKpis(): MonitoringKpis {
  const devices = allDevices();
  const count = (type: DeviceType, status?: DeviceStatus) =>
    devices.filter((d) => d.type === type && (!status || d.status === status)).length;
  const operational = devices.filter((d) => d.status === DeviceStatus.Online || d.status === DeviceStatus.Atencao).length;
  const inMaintenance = devices.filter((d) => d.status === DeviceStatus.Manutencao).length;
  return {
    availability: (operational / Math.max(1, devices.length - inMaintenance)) * 100,
    shelvesOnline: count(DeviceType.Regua, DeviceStatus.Online),
    shelvesTotal: count(DeviceType.Regua),
    camerasOnline: count(DeviceType.Camera, DeviceStatus.Online),
    camerasTotal: count(DeviceType.Camera),
    controllersOnline: count(DeviceType.Controlador, DeviceStatus.Online),
    controllersTotal: count(DeviceType.Controlador),
    gatewaysOnline: count(DeviceType.Gateway, DeviceStatus.Online),
    gatewaysTotal: count(DeviceType.Gateway),
    problems: devices.filter((d) => d.status === DeviceStatus.Offline || d.status === DeviceStatus.Atencao).length,
  };
}

export const monitoringService = {
  list: () => delay(allDevices()),
  kpis: () => delay(monitoringKpis()),

  /** Simula comando remoto de reinicialização. */
  async restart(device: DeviceRow) {
    await delay(null, 1400);
    const now = new Date().toISOString();
    if (device.type === DeviceType.Regua) {
      const s = db.shelves.get(device.id);
      if (s) db.shelves.upsert({ ...s, status: DeviceStatus.Online, lastHeartbeatAt: now });
    } else if (device.type === DeviceType.Camera) {
      const c = db.cameras.get(device.id);
      if (c) db.cameras.upsert({ ...c, status: DeviceStatus.Online, lastProcessedAt: now });
    } else {
      const d = db.devices.get(device.id);
      if (d) db.devices.upsert({ ...d, status: DeviceStatus.Online, lastHeartbeatAt: now, uptimeHours: 0 });
    }
    auditService.log({
      action: AuditAction.Dispositivo,
      summary: `${firstName(currentActor().name)} reiniciou remotamente o dispositivo ${device.code}`,
      previousValue: device.status,
      newValue: DeviceStatus.Online,
      storeId: device.storeId,
      deviceRef: device.code,
    });
    return true;
  },
};
