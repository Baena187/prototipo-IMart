import { availabilitySeries, campaignsPublishedSeries, priceChangesBaseSeries, TODAY_PRICE_BASE } from '@/data/metrics';
import {
  AlertCategory,
  AlertStatus,
  CampaignStatus,
  DeviceStatus,
  PriceChangeStatus,
  StoreStatus,
  TicketStatus,
  VisionEventType,
} from '@/types';
import { db } from './collections';
import { delay } from './db';
import { monitoringKpis } from './monitoring.service';
import { storesService, type StoreSummary } from './network.service';

export const ALERT_CATEGORY_LABEL: Record<AlertCategory, string> = {
  [AlertCategory.Dispositivo]: 'Dispositivos',
  [AlertCategory.Estoque]: 'Estoque / ruptura',
  [AlertCategory.Posicionamento]: 'Posicionamento',
  [AlertCategory.Publicacao]: 'Publicação',
  [AlertCategory.Camera]: 'Câmeras',
};

const baseAvailability = availabilitySeries();
const basePrices = priceChangesBaseSeries();
const baseCampaigns = campaignsPublishedSeries();

export interface DashboardData {
  kpis: {
    activeStores: number;
    totalStores: number;
    gondolasConnected: number;
    shelvesOnline: number;
    shelvesTotal: number;
    devicesWithProblem: number;
    activeCampaigns: number;
    priceChangesToday: number;
    ruptureAlerts: number;
    pendingApprovals: number;
    availability: number;
  };
  availability: { label: string; reguas: number; cameras: number }[];
  priceChanges: { label: string; value: number }[];
  campaigns: { label: string; publicadas: number; encerradas: number }[];
  alertsByCategory: { name: string; value: number }[];
  topStores: { name: string; alertas: number; chamados: number }[];
  operation: StoreSummary[];
}

export async function getDashboard(storeId?: string): Promise<DashboardData> {
  const summaries = await storesService.list();
  const scoped = storeId ? summaries.filter((s) => s.store.id === storeId) : summaries;
  const inScope = (id: string) => !storeId || id === storeId;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const alerts = db.alerts.all().filter((a) => a.status !== AlertStatus.Resolvido && inScope(a.storeId));
  const vision = db.visionEvents
    .all()
    .filter((e) => !e.resolved && inScope(e.storeId) && [VisionEventType.PossivelRuptura, VisionEventType.BaixoEstoque].includes(e.type));
  const publishedToday = db.prices
    .all()
    .filter((p) => p.status === PriceChangeStatus.Publicado && new Date(p.createdAt) >= startOfDay && (p.storeId === 'all' || inScope(p.storeId))).length;
  const mon = monitoringKpis();
  const shelves = db.shelves.all().filter((s) => inScope(s.storeId));
  const scale = storeId ? 1 / 16 : 1;
  const todayPrices = Math.round(TODAY_PRICE_BASE * scale) + publishedToday;

  const availability = baseAvailability.map((p, i) =>
    i === baseAvailability.length - 1 ? { ...p, reguas: Math.min(100, mon.availability) } : p,
  );

  const byCategory = Object.values(AlertCategory).map((c) => ({
    name: ALERT_CATEGORY_LABEL[c],
    value: alerts.filter((a) => a.category === c).length,
  }));

  const topStores = summaries
    .map((s) => ({
      name: s.store.name,
      alertas: db.alerts.all().filter((a) => a.storeId === s.store.id && a.status !== AlertStatus.Resolvido).length,
      chamados: db.tickets.all().filter((t) => t.storeId === s.store.id && t.status !== TicketStatus.Resolvido).length,
    }))
    .filter((s) => s.alertas + s.chamados > 0)
    .sort((a, b) => b.alertas + b.chamados - (a.alertas + a.chamados))
    .slice(0, 6);

  return delay({
    kpis: {
      activeStores: scoped.filter((s) => s.store.status !== StoreStatus.Implantacao).length,
      totalStores: scoped.length,
      gondolasConnected: db.gondolas.all().filter((g) => inScope(g.storeId) && g.status !== DeviceStatus.Manutencao).length,
      shelvesOnline: shelves.filter((s) => s.status === DeviceStatus.Online).length,
      shelvesTotal: shelves.length,
      devicesWithProblem: storeId
        ? shelves.filter((s) => s.status === DeviceStatus.Offline || s.status === DeviceStatus.Atencao).length +
          db.cameras.all().filter((c) => inScope(c.storeId) && c.status !== DeviceStatus.Online).length
        : mon.problems,
      activeCampaigns: db.campaigns.all().filter((c) => c.status === CampaignStatus.Ativa && (!storeId || c.storeIds.includes(storeId))).length,
      priceChangesToday: todayPrices,
      ruptureAlerts: vision.length + alerts.filter((a) => a.category === AlertCategory.Estoque).length,
      pendingApprovals: db.prices.all().filter((p) => p.status === PriceChangeStatus.AguardandoAprovacao).length +
        db.campaigns.all().filter((c) => c.status === CampaignStatus.AguardandoAprovacao).length,
      availability: mon.availability,
    },
    availability,
    priceChanges: basePrices.map((p, i) => (i === basePrices.length - 1 ? { ...p, value: todayPrices } : { ...p, value: Math.round(p.value * scale) })),
    campaigns: baseCampaigns,
    alertsByCategory: byCategory,
    topStores,
    operation: scoped
      .slice()
      .sort((a, b) => b.issues.length - a.issues.length || a.store.code.localeCompare(b.store.code)),
  });
}
