import type {
  AlertCategory,
  AlertSeverity,
  AlertStatus,
  AuditAction,
  CampaignStatus,
  CampaignType,
  ContentStatus,
  DeviceStatus,
  DeviceType,
  Permission,
  PriceChangeStatus,
  ProductStatus,
  ServiceStage,
  StoreStatus,
  TicketKind,
  TicketPriority,
  TicketStatus,
  UserRole,
  UserStatus,
  VisionEventType,
} from './enums';

/** Datas trafegam como string ISO 8601, igual a uma API REST. */
export type ISODate = string;

export interface Entity {
  id: string;
}

export interface Store extends Entity {
  code: string;
  name: string;
  displayName: string;
  city: string;
  uf: string;
  address: string;
  region: string;
  manager: string;
  phone: string;
  status: StoreStatus;
  stage: ServiceStage;
  goLiveAt: ISODate;
  lastSeenAt: ISODate;
  areaM2: number;
  checkouts: number;
}

export interface Gondola extends Entity {
  code: string;
  storeId: string;
  aisle: string;
  aisleNumber: number;
  category: string;
  shelfCount: number;
  cameraIds: string[];
  status: DeviceStatus;
  lastSyncAt: ISODate;
  widthMm: number;
}

export type SlotKind = 'product' | 'badge' | 'message';
export type SlotAlign = 'left' | 'center' | 'right';
export type SlotHighlight = 'none' | 'destaque' | 'promo';

export interface ShelfSlot {
  id: string;
  kind: SlotKind;
  productId?: string;
  text?: string;
  offsetMm: number;
  widthMm: number;
  align: SlotAlign;
  highlight: SlotHighlight;
  showPreviousPrice: boolean;
}

/** Posição física do produto na prateleira (planograma / leitura da câmera). */
export interface ProductFacing {
  productId: string;
  offsetMm: number;
  widthMm: number;
}

export interface ShelfLayout {
  slots: ShelfSlot[];
  updatedAt: ISODate;
  updatedBy: string;
}

export interface Shelf extends Entity {
  code: string;
  storeId: string;
  gondolaId: string;
  level: number;
  widthMm: number;
  status: DeviceStatus;
  contentStatus: ContentStatus;
  firmware: string;
  ip: string;
  controllerId: string;
  lastHeartbeatAt: ISODate;
  lastPublishAt: ISODate;
  brightness: number;
  facings: ProductFacing[];
  published: ShelfLayout;
  draft?: ShelfLayout;
  scheduledAt?: ISODate;
}

export interface Product extends Entity {
  code: string;
  sku: string;
  ean: string;
  description: string;
  shortName: string;
  brand: string;
  line?: string;
  category: string;
  unit: string;
  price: number;
  previousPrice: number;
  promoPrice?: number;
  status: ProductStatus;
  color: string;
}

export interface PriceChange extends Entity {
  productId: string;
  storeId: string | 'all';
  currentPrice: number;
  newPrice: number;
  startAt: ISODate;
  endAt?: ISODate;
  status: PriceChangeStatus;
  requestedBy: string;
  approvedBy?: string;
  createdAt: ISODate;
  reason: string;
  requiresApproval: boolean;
  source: 'manual' | 'massa' | 'importacao' | 'regua' | 'campanha';
}

export interface Campaign extends Entity {
  name: string;
  type: CampaignType;
  brand: string;
  productIds: string[];
  storeIds: string[];
  startDate: ISODate;
  endDate: ISODate;
  startTime: string;
  endTime: string;
  layout: CampaignLayout;
  message: string;
  priority: 'baixa' | 'media' | 'alta';
  color: CampaignColor;
  discountPct: number;
  status: CampaignStatus;
  createdBy: string;
  approvedBy?: string;
  createdAt: ISODate;
  reach: { shelves: number; impressions: number };
}

export type CampaignLayout = 'preco_selo' | 'de_por' | 'faixa' | 'selo_lateral';
export type CampaignColor = 'vermelho' | 'azul' | 'grafite' | 'verde' | 'amarelo';

export interface Device extends Entity {
  code: string;
  type: DeviceType;
  storeId: string;
  gondolaId?: string;
  location: string;
  status: DeviceStatus;
  ip: string;
  firmware: string;
  temperatureC: number;
  signalDbm: number;
  uptimeHours: number;
  lastHeartbeatAt: ISODate;
  lastPublishAt?: ISODate;
  model: string;
}

export interface Camera extends Entity {
  code: string;
  storeId: string;
  gondolaId: string;
  aisle: string;
  status: DeviceStatus;
  lastProcessedAt: ISODate;
  productsDetected: number;
  productsExpected: number;
  ruptureCount: number;
  misplacedCount: number;
  occupancyPct: number;
  resolution: string;
  model: string;
}

export interface VisionEvent extends Entity {
  cameraId: string;
  storeId: string;
  gondolaId: string;
  type: VisionEventType;
  productId?: string;
  shelfLevel: number;
  confidence: number;
  detectedAt: ISODate;
  resolved: boolean;
}

export interface AlertNote {
  id: string;
  author: string;
  text: string;
  createdAt: ISODate;
}

export interface Alert extends Entity {
  title: string;
  description: string;
  severity: AlertSeverity;
  category: AlertCategory;
  status: AlertStatus;
  storeId: string;
  deviceRef?: string;
  createdAt: ISODate;
  assigneeId?: string;
  acknowledgedAt?: ISODate;
  resolvedAt?: ISODate;
  notes: AlertNote[];
  link?: string;
}

export interface TicketEvent {
  id: string;
  at: ISODate;
  author: string;
  text: string;
  status?: TicketStatus;
}

export interface TicketAttachment {
  id: string;
  name: string;
  sizeKb: number;
  kind: 'imagem' | 'pdf' | 'log';
}

export interface Ticket extends Entity {
  number: string;
  kind: TicketKind;
  client: string;
  storeId: string;
  equipment: string;
  problem: string;
  description: string;
  priority: TicketPriority;
  slaHours: number;
  openedAt: ISODate;
  dueAt: ISODate;
  scheduledAt?: ISODate;
  technicianId?: string;
  status: TicketStatus;
  history: TicketEvent[];
  attachments: TicketAttachment[];
}

export interface User extends Entity {
  name: string;
  email: string;
  role: UserRole;
  storeIds: string[] | 'all';
  status: UserStatus;
  lastAccessAt?: ISODate;
  phone?: string;
  organization: string;
}

export interface RoleDefinition {
  role: UserRole;
  label: string;
  description: string;
  permissions: Permission[];
}

export interface AuditEvent extends Entity {
  at: ISODate;
  userId?: string;
  userName: string;
  action: AuditAction;
  summary: string;
  previousValue?: string;
  newValue?: string;
  storeId?: string;
  deviceRef?: string;
  origin: string;
}

export interface AppSettings {
  requireManagerApproval: boolean;
  approvalThresholdPct: number;
  approvalForCampaigns: boolean;
  publicationWindowStart: string;
  publicationWindowEnd: string;
  defaultBrightness: number;
  heartbeatAlertMinutes: number;
  notifyEmail: boolean;
  notifyCritical: boolean;
  companyName: string;
}

export interface ServicePlan {
  id: string;
  name: string;
  tagline: string;
  current: boolean;
  services: string[];
  price: string;
  sla: string;
}

export interface Notification extends Entity {
  title: string;
  description: string;
  at: ISODate;
  read: boolean;
  link?: string;
  tone: 'info' | 'warning' | 'danger' | 'success';
}

/** Preço vigente por loja (resultado de publicações de preço). */
export interface StorePrice extends Entity {
  storeId: string;
  productId: string;
  price: number;
  previousPrice: number;
  updatedAt: ISODate;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: import('./enums').UserRole;
}
