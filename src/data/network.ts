/**
 * Gera a malha de dispositivos da rede (gôndolas, réguas, câmeras, controladores, gateways)
 * de forma determinística. Em produção estes dados viriam da API de inventário.
 */
import {
  ContentStatus,
  DeviceStatus,
  DeviceType,
  StoreStatus,
  type Camera,
  type Device,
  type Gondola,
  type Product,
  type ProductFacing,
  type Shelf,
  type ShelfSlot,
  type Store,
} from '@/types';
import { createRng } from '@/utils/random';
import { hoursAgo, minutesAgo } from '@/utils/time';
import { productsSeed } from './products';
import { storesSeed } from './stores';

const SHELF_WIDTH_MM = 1500;

interface AisleDef {
  aisle: string;
  category: string;
  pools: string[];
}

const AISLES: AisleDef[] = [
  { aisle: 'Massas e Molhos', category: 'Mercearia salgada', pools: ['Massas', 'Molhos e Atomatados', 'Amidos e Farináceos'] },
  { aisle: 'Massas', category: 'Massas', pools: ['Massas'] },
  { aisle: 'Molhos e Atomatados', category: 'Mercearia salgada', pools: ['Molhos e Atomatados', 'Massas'] },
  { aisle: 'Farináceos', category: 'Amidos e Farináceos', pools: ['Amidos e Farináceos'] },
  { aisle: 'Biscoitos', category: 'Biscoitos', pools: ['Biscoitos'] },
  { aisle: 'Chás, Erva-Mate e Tereré', category: 'Erva-Mate e Tereré', pools: ['Erva-Mate e Tereré'] },
  { aisle: 'Bebidas em Pó', category: 'Refrescos', pools: ['Refrescos'] },
  { aisle: 'Food Service', category: 'Food Service', pools: ['Food Service', 'Refrescos'] },
  { aisle: 'Pet Shop', category: 'Pet', pools: ['Pet'] },
];

const GONDOLA_COUNT: Record<string, number> = {
  'LJ-001': 18, 'LJ-002': 16, 'LJ-003': 17, 'LJ-004': 14, 'LJ-005': 13, 'LJ-006': 16,
  'LJ-007': 14, 'LJ-008': 12, 'LJ-009': 15, 'LJ-010': 12, 'LJ-011': 11, 'LJ-012': 15,
  'LJ-013': 11, 'LJ-014': 12, 'LJ-015': 10, 'LJ-016': 16, 'LJ-017': 12, 'LJ-018': 3,
};

export interface NetworkData {
  gondolas: Gondola[];
  shelves: Shelf[];
  cameras: Camera[];
  devices: Device[];
}

let cache: NetworkData | null = null;

const pad = (n: number, size = 2) => String(n).padStart(size, '0');

function buildFacings(rng: ReturnType<typeof createRng>, pool: Product[]): ProductFacing[] {
  const facings: ProductFacing[] = [];
  let cursor = rng.int(10, 40);
  const used = new Set<string>();
  while (cursor < SHELF_WIDTH_MM - 170 && used.size < pool.length) {
    const product = rng.pick(pool);
    if (used.has(product.id)) continue;
    used.add(product.id);
    const width = Math.min(rng.int(18, 32) * 10, SHELF_WIDTH_MM - cursor - 10);
    if (width < 160) break;
    facings.push({ productId: product.id, offsetMm: cursor, widthMm: width });
    cursor += width + rng.int(1, 3) * 10;
  }
  return facings;
}

function slotsFromFacings(
  rng: ReturnType<typeof createRng>,
  shelfId: string,
  facings: ProductFacing[],
  misalign: boolean,
): ShelfSlot[] {
  return facings.map((f, i) => {
    const drift = misalign && i % 2 === 1 ? rng.int(3, 6) * 10 * (rng.chance(0.5) ? 1 : -1) : 0;
    const width = f.widthMm - 20;
    const offset = Math.max(0, Math.min(SHELF_WIDTH_MM - width, f.offsetMm + 10 + drift));
    return {
      id: `${shelfId}-s${i + 1}`,
      kind: 'product',
      productId: f.productId,
      offsetMm: offset,
      widthMm: width,
      align: 'center',
      highlight: rng.chance(0.12) ? 'promo' : 'none',
      showPreviousPrice: false,
    };
  });
}

/** Régua de referência da demonstração: G07-P03 da Loja Goiânia Centro. */
function referenceShelf(shelfId: string, byName: (n: string) => Product): { facings: ProductFacing[]; slots: ShelfSlot[] } {
  const facings: ProductFacing[] = [
    { productId: byName('Zaeli Maizena').id, offsetMm: 20, widthMm: 250 },
    { productId: byName('Renata Espaguete').id, offsetMm: 400, widthMm: 280 },
    { productId: byName('Renata Parafuso').id, offsetMm: 700, widthMm: 250 },
    { productId: byName('Galo Penne').id, offsetMm: 970, widthMm: 240 },
    { productId: byName('Zaeli Molho de Tomate').id, offsetMm: 1230, widthMm: 250 },
  ];
  const slots: ShelfSlot[] = [
    { id: `${shelfId}-s1`, kind: 'product', productId: facings[0].productId, offsetMm: 30, widthMm: 230, align: 'center', highlight: 'none', showPreviousPrice: false },
    { id: `${shelfId}-s2`, kind: 'badge', text: 'OFERTA', offsetMm: 280, widthMm: 120, align: 'center', highlight: 'promo', showPreviousPrice: false },
    { id: `${shelfId}-s3`, kind: 'product', productId: facings[1].productId, offsetMm: 460, widthMm: 260, align: 'center', highlight: 'none', showPreviousPrice: false },
    { id: `${shelfId}-s4`, kind: 'product', productId: facings[2].productId, offsetMm: 740, widthMm: 230, align: 'center', highlight: 'none', showPreviousPrice: false },
    { id: `${shelfId}-s5`, kind: 'product', productId: facings[3].productId, offsetMm: 980, widthMm: 220, align: 'center', highlight: 'none', showPreviousPrice: false },
    { id: `${shelfId}-s6`, kind: 'product', productId: facings[4].productId, offsetMm: 1240, widthMm: 230, align: 'center', highlight: 'destaque', showPreviousPrice: false },
  ];
  return { facings, slots };
}

export function buildNetwork(): NetworkData {
  if (cache) return cache;
  const rng = createRng(20240917);
  const stores: Store[] = storesSeed();
  const products = productsSeed().filter((p) => p.status !== 'inativo');
  const byCategory = (cats: string[]) => products.filter((p) => cats.includes(p.category));
  const byName = (n: string) => products.find((p) => p.shortName === n)!;

  const gondolas: Gondola[] = [];
  const shelves: Shelf[] = [];
  const cameras: Camera[] = [];
  const devices: Device[] = [];
  let camSeq = 1;

  stores.forEach((store, si) => {
    const count = GONDOLA_COUNT[store.code] ?? 10;
    const subnet = 10 + si;
    const gatewayCount = count > 14 ? 2 : 1;
    for (let g = 1; g <= gatewayCount; g++) {
      devices.push({
        id: `${store.id}-gw${g}`,
        code: `GW-${store.code.slice(3)}-${g}`,
        type: DeviceType.Gateway,
        storeId: store.id,
        location: g === 1 ? 'CPD da loja' : 'Depósito / retaguarda',
        status: store.status === StoreStatus.Critico && g === 1 ? DeviceStatus.Atencao : DeviceStatus.Online,
        ip: `10.${subnet}.0.${g}`,
        firmware: 'gw-2.4.1',
        temperatureC: rng.int(36, 48),
        signalDbm: -rng.int(38, 55),
        uptimeHours: rng.int(200, 2600),
        lastHeartbeatAt: minutesAgo(rng.int(0, 1)),
        model: 'iMart Edge Gateway EG-200',
      });
    }
    devices.push({
      id: `${store.id}-sync`,
      code: `SYNC-${store.code.slice(3)}`,
      type: DeviceType.Sincronizacao,
      storeId: store.id,
      location: 'Serviço de sincronização (edge)',
      status: store.code === 'LJ-013' ? DeviceStatus.Atencao : store.status === StoreStatus.Implantacao ? DeviceStatus.Manutencao : DeviceStatus.Online,
      ip: `10.${subnet}.0.10`,
      firmware: 'sync-5.12.0',
      temperatureC: 0,
      signalDbm: 0,
      uptimeHours: rng.int(100, 1500),
      lastHeartbeatAt: minutesAgo(store.code === 'LJ-013' ? 38 : 1),
      lastPublishAt: minutesAgo(rng.int(3, 90)),
      model: 'iMart Sync Service',
    });

    for (let g = 1; g <= count; g++) {
      const aisleDef = store.code === 'LJ-001' && g === 7 ? AISLES[0] : AISLES[(g - 1 + si) % AISLES.length];
      const gondolaId = `${store.id}-g${pad(g)}`;
      const shelfCount = store.code === 'LJ-001' && g === 7 ? 6 : rng.int(4, 6);
      const camCount = store.status === StoreStatus.Implantacao ? 0 : g % 3 === 0 ? 0 : g % 3 === 1 ? 1 : rng.int(0, 2);
      const finalCamCount = store.code === 'LJ-001' && g === 7 ? 2 : camCount;
      const cameraIds: string[] = [];
      for (let c = 0; c < finalCamCount; c++) {
        const camId = `cam-${pad(camSeq, 3)}`;
        const expected = shelfCount * rng.int(5, 7);
        const rupture = rng.chance(0.35) ? rng.int(1, 3) : 0;
        const misplaced = rng.chance(0.3) ? rng.int(1, 2) : 0;
        cameras.push({
          id: camId,
          code: `CAM-${pad(camSeq, 3)}`,
          storeId: store.id,
          gondolaId,
          aisle: aisleDef.aisle,
          status: DeviceStatus.Online,
          lastProcessedAt: minutesAgo(rng.int(1, 12)),
          productsDetected: expected - rupture - rng.int(0, 2),
          productsExpected: expected,
          ruptureCount: rupture,
          misplacedCount: misplaced,
          occupancyPct: rng.int(72, 98),
          resolution: '2560 × 1440',
          model: c === 0 ? 'Hikvision DS-2CD2T47' : 'Intelbras VIP 3430',
        });
        cameraIds.push(camId);
        camSeq++;
      }

      const gondola: Gondola = {
        id: gondolaId,
        code: `G-${pad(g)}`,
        storeId: store.id,
        aisle: aisleDef.aisle,
        aisleNumber: Math.ceil(g / 2),
        category: aisleDef.category,
        shelfCount,
        cameraIds,
        status: store.status === StoreStatus.Implantacao ? DeviceStatus.Manutencao : DeviceStatus.Online,
        lastSyncAt: minutesAgo(rng.int(1, 25)),
        widthMm: SHELF_WIDTH_MM,
      };
      gondolas.push(gondola);

      devices.push({
        id: `${gondolaId}-ctl`,
        code: `CTL-${store.code.slice(3)}-G${pad(g)}`,
        type: DeviceType.Controlador,
        storeId: store.id,
        gondolaId,
        location: `Gôndola G-${pad(g)} · ${aisleDef.aisle}`,
        status: gondola.status,
        ip: `10.${subnet}.1.${g}`,
        firmware: rng.chance(0.85) ? 'ctl-3.8.2' : 'ctl-3.7.9',
        temperatureC: rng.int(34, 51),
        signalDbm: -rng.int(42, 68),
        uptimeHours: rng.int(80, 2400),
        lastHeartbeatAt: minutesAgo(rng.int(0, 2)),
        lastPublishAt: minutesAgo(rng.int(4, 240)),
        model: 'iMart Shelf Controller SC-6',
      });

      const pool = byCategory(aisleDef.pools);
      for (let level = 1; level <= shelfCount; level++) {
        const shelfId = `${gondolaId}-p${pad(level)}`;
        const isReference = store.code === 'LJ-001' && g === 7 && level === 3;
        let facings: ProductFacing[];
        let slots: ShelfSlot[];
        if (isReference) {
          ({ facings, slots } = referenceShelf(shelfId, byName));
        } else {
          facings = buildFacings(rng, pool);
          slots = slotsFromFacings(rng, shelfId, facings, rng.chance(0.18));
        }
        const updatedAt = hoursAgo(rng.int(2, 96));
        shelves.push({
          id: shelfId,
          code: `G${pad(g)}-P${pad(level)}`,
          storeId: store.id,
          gondolaId,
          level,
          widthMm: SHELF_WIDTH_MM,
          status: store.status === StoreStatus.Implantacao ? DeviceStatus.Manutencao : DeviceStatus.Online,
          contentStatus: ContentStatus.Publicado,
          firmware: rng.chance(0.9) ? 'led-1.14.3' : 'led-1.13.8',
          ip: `10.${subnet}.${2 + Math.floor(g / 50)}.${(g * 8 + level) % 254}`,
          controllerId: `${gondolaId}-ctl`,
          lastHeartbeatAt: minutesAgo(rng.int(0, 2)),
          lastPublishAt: updatedAt,
          brightness: 80,
          facings,
          published: { slots, updatedAt, updatedBy: 'Sistema' },
        });
      }
    }
  });

  // Ocorrências pontuais que alimentam alertas, monitoramento e dashboard.
  const setShelf = (code: string, storeCode: string, patch: Partial<Shelf>) => {
    const storeId = storeCode.toLowerCase().replace('-', '');
    const shelf = shelves.find((s) => s.code === code && s.storeId === storeId);
    if (shelf) Object.assign(shelf, patch);
  };
  setShelf('G07-P03', 'LJ-006', { status: DeviceStatus.Offline, lastHeartbeatAt: minutesAgo(12) });
  setShelf('G11-P02', 'LJ-006', { status: DeviceStatus.Offline, lastHeartbeatAt: minutesAgo(47) });
  setShelf('G03-P01', 'LJ-003', { status: DeviceStatus.Atencao, lastHeartbeatAt: minutesAgo(4) });
  setShelf('G05-P04', 'LJ-003', { status: DeviceStatus.Atencao, lastHeartbeatAt: minutesAgo(3) });
  setShelf('G02-P02', 'LJ-013', { status: DeviceStatus.Offline, lastHeartbeatAt: minutesAgo(38) });
  setShelf('G02-P03', 'LJ-013', { status: DeviceStatus.Offline, lastHeartbeatAt: minutesAgo(38) });
  setShelf('G02-P04', 'LJ-013', { status: DeviceStatus.Offline, lastHeartbeatAt: minutesAgo(38) });
  setShelf('G08-P05', 'LJ-013', { status: DeviceStatus.Offline, lastHeartbeatAt: minutesAgo(38) });
  setShelf('G09-P01', 'LJ-009', { status: DeviceStatus.Manutencao, lastHeartbeatAt: hoursAgo(20) });
  setShelf('G04-P02', 'LJ-012', { status: DeviceStatus.Atencao, lastHeartbeatAt: minutesAgo(6) });
  setShelf('G10-P03', 'LJ-002', { status: DeviceStatus.Offline, lastHeartbeatAt: minutesAgo(95) });
  setShelf('G06-P01', 'LJ-016', { status: DeviceStatus.Offline, lastHeartbeatAt: minutesAgo(22) });

  // A câmera CAM-021 fica na Loja Cuiabá CPA (sem comunicação).
  const cuiabaCam = cameras.find((c) => c.storeId === 'lj009');
  const cam21 = cameras.find((c) => c.code === 'CAM-021');
  if (cuiabaCam && cam21 && cuiabaCam !== cam21) {
    const code = cuiabaCam.code;
    cuiabaCam.code = cam21.code;
    cam21.code = code;
  }
  if (cuiabaCam) Object.assign(cuiabaCam, { status: DeviceStatus.Offline, lastProcessedAt: minutesAgo(64) });
  const ljd = cameras.filter((c) => c.storeId === 'lj013');
  if (ljd[0]) Object.assign(ljd[0], { status: DeviceStatus.Offline, lastProcessedAt: minutesAgo(38) });
  const bsb = cameras.filter((c) => c.storeId === 'lj003');
  if (bsb[1]) Object.assign(bsb[1], { status: DeviceStatus.Atencao });

  // Gôndolas refletem o pior status das réguas.
  for (const g of gondolas) {
    const own = shelves.filter((s) => s.gondolaId === g.id);
    if (own.some((s) => s.status === DeviceStatus.Offline)) g.status = DeviceStatus.Atencao;
    else if (own.some((s) => s.status === DeviceStatus.Atencao)) g.status = DeviceStatus.Atencao;
  }

  cameras.sort((a, b) => a.code.localeCompare(b.code));

  cache = { gondolas, shelves, cameras, devices };
  return cache;
}
