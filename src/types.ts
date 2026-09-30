export type Role = 'vendedor' | 'gestora' | 'promotor' | 'admin';

export type Status =
  | 'SOLICITADA'
  | 'AGUARDANDO_PROMOTOR'
  | 'PROMOTOR_DEFINIDO'
  | 'CONFIRMADA'
  | 'EM_ANDAMENTO'
  | 'FINALIZADA'
  | 'CANCELADA';

export interface Client {
  codcli: string;
  razao: string;
  fantasia: string;
  cnpj: string;
  cidade: string;
  bairro: string;
  endereco: string;
  rede: string;
  vendedorId: string;
  ativo: boolean;
}

export interface Seller { id: string; nome: string; email: string; regional: string; ativo: boolean }
export interface Promoter { id: string; nome: string; email: string; telefone: string; cidade: string; ativo: boolean }
export interface AppUser { id: string; nome: string; email: string; perfil: Role; ativo: boolean }
export interface Brand { id: string; nome: string; ativo: boolean }
export interface Product { id: string; brandId: string; nome: string; ativo: boolean }
export interface ActionType { id: string; nome: string; ativo: boolean }

export interface TimelineEvent { at: string; text: string; by: string }

export interface Tasting {
  id: string;
  codcli: string;
  date: string; // AAAA-MM-DD
  start: string; // HH:MM
  end: string;
  tipoId: string;
  tipoOutro?: string;
  brandId: string;
  marcaOutra?: string;
  productIds: string[];
  produtoOutro?: string;
  materiais: string[];
  obs: string;
  vendedorId: string;
  promotorId: string | null;
  status: Status;
  createdAt: string; // AAAA-MM-DDTHH:MM
  startedAt?: string;
  finishedAt?: string;
  attendees?: number;
  finalNote?: string;
  cancelReason?: string;
  cancelRequest?: { motivo: string; obs: string; at: string; by: string } | null;
  events: TimelineEvent[];
}

export interface Notification {
  id: string;
  role: Role;
  userId?: string;
  text: string;
  at: string;
  read: boolean;
  tastingId?: string;
}

export interface Settings {
  minLeadDays: number;
  slotsPerPromoter: number;
  refDate: string;
  allowStartAnyDate: boolean;
  operacaoInicio: string;
  operacaoFim: string;
  lastImport: string | null;
}

export type Page =
  | 'dashboard'
  | 'agendamentos'
  | 'novo'
  | 'calendario'
  | 'clientes'
  | 'promotores'
  | 'historico'
  | 'admin'
  | 'configuracoes';
