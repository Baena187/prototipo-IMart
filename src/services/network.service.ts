import {
  AlertStatus,
  AuditAction,
  CampaignStatus,
  ContentStatus,
  DeviceStatus,
  type Alert,
  type Camera,
  type Campaign,
  type Gondola,
  type Shelf,
  type ShelfSlot,
  type Store,
  type Ticket,
} from '@/types';
import { formatDateTime } from '@/utils/format';
import { layoutsEqual } from '@/utils/shelf';
import { auditService } from './audit.service';
import { db } from './collections';
import { delay } from './db';
import { notificationsService } from './notifications.service';
import { pricesService } from './prices.service';
import { currentActor, firstName } from './session';

export interface StoreSummary {
  store: Store;
  gondolas: number;
  shelves: number;
  shelvesOnline: number;
  cameras: number;
  camerasOnline: number;
  openAlerts: number;
  criticalAlerts: number;
  activeCampaigns: number;
  issues: string[];
}

function summarize(store: Store): StoreSummary {
  const shelves = db.shelves.all().filter((s) => s.storeId === store.id);
  const cameras = db.cameras.all().filter((c) => c.storeId === store.id);
  const alerts = db.alerts.all().filter((a) => a.storeId === store.id && a.status !== AlertStatus.Resolvido);
  const offline = shelves.filter((s) => s.status === DeviceStatus.Offline).length;
  const warn = shelves.filter((s) => s.status === DeviceStatus.Atencao).length;
  const camOff = cameras.filter((c) => c.status === DeviceStatus.Offline).length;
  const issues: string[] = [];
  if (offline) issues.push(`${offline} ${offline > 1 ? 'réguas offline' : 'régua offline'}`);
  if (warn) issues.push(`${warn} ${warn > 1 ? 'réguas em atenção' : 'régua em atenção'}`);
  if (camOff) issues.push(`${camOff} ${camOff > 1 ? 'câmeras desconectadas' : 'câmera desconectada'}`);
  return {
    store,
    gondolas: db.gondolas.all().filter((g) => g.storeId === store.id).length,
    shelves: shelves.length,
    shelvesOnline: shelves.filter((s) => s.status === DeviceStatus.Online).length,
    cameras: cameras.length,
    camerasOnline: cameras.filter((c) => c.status === DeviceStatus.Online).length,
    openAlerts: alerts.length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critico').length,
    activeCampaigns: db.campaigns.all().filter((c) => c.status === CampaignStatus.Ativa && c.storeIds.includes(store.id)).length,
    issues,
  };
}

export interface StoreDetail extends StoreSummary {
  gondolaList: Gondola[];
  campaigns: Campaign[];
  alerts: Alert[];
  tickets: Ticket[];
  recent: ReturnType<typeof db.audit.all>;
}

export const storesService = {
  listSync: () => db.stores.all(),
  list: () => delay(db.stores.all().map(summarize)),
  async get(id: string): Promise<StoreDetail | undefined> {
    const store = db.stores.get(id);
    if (!store) return delay(undefined);
    return delay({
      ...summarize(store),
      gondolaList: db.gondolas.all().filter((g) => g.storeId === id),
      campaigns: db.campaigns.all().filter((c) => c.storeIds.includes(id)),
      alerts: db.alerts.all().filter((a) => a.storeId === id),
      tickets: db.tickets.all().filter((t) => t.storeId === id),
      recent: db.audit.all().filter((a) => a.storeId === id).slice(0, 8),
    });
  },
};

export interface GondolaRow {
  gondola: Gondola;
  store: Store;
  shelves: number;
  shelvesOffline: number;
  cameras: number;
}

export interface GondolaDetail {
  gondola: Gondola;
  store: Store;
  shelves: Shelf[];
  cameras: Camera[];
}

export const gondolasService = {
  list: () =>
    delay(
      db.gondolas.all().map<GondolaRow>((g) => {
        const shelves = db.shelves.all().filter((s) => s.gondolaId === g.id);
        return {
          gondola: g,
          store: db.stores.get(g.storeId)!,
          shelves: shelves.length,
          shelvesOffline: shelves.filter((s) => s.status === DeviceStatus.Offline).length,
          cameras: g.cameraIds.length,
        };
      }),
    ),
  async get(id: string): Promise<GondolaDetail | undefined> {
    const gondola = db.gondolas.get(id);
    if (!gondola) return delay(undefined);
    return delay({
      gondola,
      store: db.stores.get(gondola.storeId)!,
      shelves: db.shelves.all().filter((s) => s.gondolaId === id).sort((a, b) => b.level - a.level),
      cameras: db.cameras.all().filter((c) => gondola.cameraIds.includes(c.id)),
    });
  },
};

export interface ShelfRow {
  shelf: Shelf;
  gondola: Gondola;
  store: Store;
}

export interface ShelfDetail extends ShelfRow {
  siblings: Shelf[];
}

export interface PublishResult {
  published: number;
  pendingApproval: number;
  offline: boolean;
}

function logLayoutChange(shelf: Shelf, before: ShelfSlot[], after: ShelfSlot[]) {
  const moved = after.filter((s) => {
    const prev = before.find((b) => b.id === s.id);
    return prev && (prev.offsetMm !== s.offsetMm || prev.widthMm !== s.widthMm);
  });
  if (moved.length === 1) {
    const s = moved[0];
    const prev = before.find((b) => b.id === s.id)!;
    const name = s.productId ? db.products.get(s.productId)?.shortName : s.text;
    auditService.log({
      action: AuditAction.AjustePosicao,
      summary: `${firstName(currentActor().name)} ajustou a posição de ${name} na régua ${shelf.code}`,
      previousValue: `${prev.offsetMm} mm · ${prev.widthMm} mm`,
      newValue: `${s.offsetMm} mm · ${s.widthMm} mm`,
      storeId: shelf.storeId,
      deviceRef: shelf.code,
    });
  } else if (moved.length > 1) {
    auditService.log({
      action: AuditAction.AjustePosicao,
      summary: `${firstName(currentActor().name)} reposicionou ${moved.length} blocos na régua ${shelf.code}`,
      previousValue: `${before.length} blocos`,
      newValue: `${after.length} blocos`,
      storeId: shelf.storeId,
      deviceRef: shelf.code,
    });
  }
}

export const shelvesService = {
  list: () =>
    delay(
      db.shelves.all().map<ShelfRow>((s) => ({
        shelf: s,
        gondola: db.gondolas.get(s.gondolaId)!,
        store: db.stores.get(s.storeId)!,
      })),
    ),

  async get(id: string): Promise<ShelfDetail | undefined> {
    const shelf = db.shelves.get(id);
    if (!shelf) return delay(undefined);
    return delay({
      shelf,
      gondola: db.gondolas.get(shelf.gondolaId)!,
      store: db.stores.get(shelf.storeId)!,
      siblings: db.shelves.all().filter((s) => s.gondolaId === shelf.gondolaId).sort((a, b) => a.level - b.level),
    });
  },

  async saveDraft(id: string, slots: ShelfSlot[]) {
    const shelf = db.shelves.get(id);
    if (!shelf) throw new Error('Régua não encontrada');
    const actor = currentActor();
    db.shelves.upsert({
      ...shelf,
      contentStatus: ContentStatus.Rascunho,
      scheduledAt: undefined,
      draft: { slots, updatedAt: new Date().toISOString(), updatedBy: actor.name },
    });
    return delay(true, 350);
  },

  async publish(id: string, slots: ShelfSlot[], priceEdits: Record<string, number>): Promise<PublishResult> {
    const shelf = db.shelves.get(id);
    if (!shelf) throw new Error('Régua não encontrada');
    const actor = currentActor();
    await delay(null, 1100);

    let published = 0;
    let pendingApproval = 0;
    Object.entries(priceEdits).forEach(([productId, price]) => {
      const change = pricesService.publishFromShelf(productId, shelf.storeId, price);
      if (!change) return;
      if (change.status === 'publicado') published++;
      else pendingApproval++;
    });

    const now = new Date().toISOString();
    if (!layoutsEqual(shelf.published.slots, slots)) logLayoutChange(shelf, shelf.published.slots, slots);
    const updated = db.shelves.upsert({
      ...db.shelves.get(id)!,
      published: { slots, updatedAt: now, updatedBy: actor.name },
      draft: undefined,
      scheduledAt: undefined,
      contentStatus: ContentStatus.Publicado,
      lastPublishAt: now,
    });
    auditService.log({
      action: AuditAction.PublicacaoRegua,
      summary: `${firstName(actor.name)} publicou conteúdo na régua ${updated.code}`,
      previousValue: `Layout de ${formatDateTime(shelf.published.updatedAt)}`,
      newValue: `${slots.length} blocos · ${published} preço(s) alterado(s)`,
      storeId: updated.storeId,
      deviceRef: updated.code,
    });
    const store = db.stores.get(updated.storeId);
    notificationsService.push({
      title: `Régua ${updated.code} publicada`,
      description: `${store?.name ?? ''} · ${slots.length} blocos`,
      link: `/reguas/${updated.id}/editor`,
      tone: 'success',
    });
    return { published, pendingApproval, offline: updated.status === DeviceStatus.Offline };
  },

  async schedule(id: string, slots: ShelfSlot[], at: string) {
    const shelf = db.shelves.get(id);
    if (!shelf) throw new Error('Régua não encontrada');
    const actor = currentActor();
    db.shelves.upsert({
      ...shelf,
      contentStatus: ContentStatus.Agendado,
      scheduledAt: at,
      draft: { slots, updatedAt: new Date().toISOString(), updatedBy: actor.name },
    });
    auditService.log({
      action: AuditAction.PublicacaoRegua,
      summary: `${firstName(actor.name)} agendou publicação na régua ${shelf.code}`,
      newValue: formatDateTime(at),
      storeId: shelf.storeId,
      deviceRef: shelf.code,
    });
    return delay(true, 350);
  },

  async discardDraft(id: string) {
    const shelf = db.shelves.get(id);
    if (!shelf) return;
    db.shelves.upsert({ ...shelf, draft: undefined, scheduledAt: undefined, contentStatus: ContentStatus.Publicado });
    return delay(true, 200);
  },

  processScheduled() {
    const now = Date.now();
    db.shelves
      .all()
      .filter((s) => s.contentStatus === ContentStatus.Agendado && s.scheduledAt && new Date(s.scheduledAt).getTime() <= now && s.draft)
      .forEach((s) => {
        db.shelves.upsert({
          ...s,
          published: { ...s.draft!, updatedAt: new Date().toISOString(), updatedBy: 'Sistema' },
          draft: undefined,
          scheduledAt: undefined,
          contentStatus: ContentStatus.Publicado,
          lastPublishAt: new Date().toISOString(),
        });
        auditService.log({ action: AuditAction.PublicacaoRegua, summary: `Sistema publicou conteúdo agendado na régua ${s.code}`, storeId: s.storeId, deviceRef: s.code, system: true });
      });
  },
};
