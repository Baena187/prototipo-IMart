import type { BadgeTone } from '@/components/ui/badge';
import {
  AlertSeverity,
  AlertStatus,
  AuditAction,
  CampaignStatus,
  ContentStatus,
  DeviceStatus,
  DeviceType,
  PriceChangeStatus,
  ProductStatus,
  ServiceStage,
  StoreStatus,
  TicketKind,
  TicketPriority,
  TicketStatus,
  UserStatus,
  VisionEventType,
} from '@/types';

export interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

export type StatusMap<T extends string> = Record<T, StatusMeta>;

export const DEVICE_STATUS: StatusMap<DeviceStatus> = {
  [DeviceStatus.Online]: { label: 'Online', tone: 'green' },
  [DeviceStatus.Atencao]: { label: 'Atenção', tone: 'amber' },
  [DeviceStatus.Offline]: { label: 'Offline', tone: 'red' },
  [DeviceStatus.Manutencao]: { label: 'Manutenção', tone: 'neutral' },
};

export const STORE_STATUS: StatusMap<StoreStatus> = {
  [StoreStatus.Normal]: { label: 'Operação normal', tone: 'green' },
  [StoreStatus.Atencao]: { label: 'Atenção', tone: 'amber' },
  [StoreStatus.Critico]: { label: 'Crítico', tone: 'red' },
  [StoreStatus.Implantacao]: { label: 'Em implantação', tone: 'blue' },
};

export const CONTENT_STATUS: StatusMap<ContentStatus> = {
  [ContentStatus.Publicado]: { label: 'Publicado', tone: 'green' },
  [ContentStatus.Rascunho]: { label: 'Rascunho', tone: 'neutral' },
  [ContentStatus.Agendado]: { label: 'Agendado', tone: 'blue' },
};

export const PRODUCT_STATUS: StatusMap<ProductStatus> = {
  [ProductStatus.Ativo]: { label: 'Ativo', tone: 'green' },
  [ProductStatus.Inativo]: { label: 'Inativo', tone: 'neutral' },
  [ProductStatus.Lancamento]: { label: 'Lançamento', tone: 'blue' },
};

export const PRICE_STATUS: StatusMap<PriceChangeStatus> = {
  [PriceChangeStatus.Rascunho]: { label: 'Rascunho', tone: 'neutral' },
  [PriceChangeStatus.AguardandoAprovacao]: { label: 'Aguardando aprovação', tone: 'amber' },
  [PriceChangeStatus.Aprovado]: { label: 'Aprovado', tone: 'blue' },
  [PriceChangeStatus.Agendado]: { label: 'Agendado', tone: 'violet' },
  [PriceChangeStatus.Publicado]: { label: 'Publicado', tone: 'green' },
  [PriceChangeStatus.Rejeitado]: { label: 'Rejeitado', tone: 'red' },
};

export const CAMPAIGN_STATUS: StatusMap<CampaignStatus> = {
  [CampaignStatus.Rascunho]: { label: 'Rascunho', tone: 'neutral' },
  [CampaignStatus.AguardandoAprovacao]: { label: 'Aguardando aprovação', tone: 'amber' },
  [CampaignStatus.Agendada]: { label: 'Agendada', tone: 'violet' },
  [CampaignStatus.Ativa]: { label: 'Ativa', tone: 'green' },
  [CampaignStatus.Pausada]: { label: 'Pausada', tone: 'outline' },
  [CampaignStatus.Encerrada]: { label: 'Encerrada', tone: 'neutral' },
};

export const ALERT_SEVERITY: StatusMap<AlertSeverity> = {
  [AlertSeverity.Informativo]: { label: 'Informativo', tone: 'blue' },
  [AlertSeverity.Atencao]: { label: 'Atenção', tone: 'amber' },
  [AlertSeverity.Critico]: { label: 'Crítico', tone: 'red' },
};

export const ALERT_STATUS: StatusMap<AlertStatus> = {
  [AlertStatus.Aberto]: { label: 'Aberto', tone: 'outline' },
  [AlertStatus.Reconhecido]: { label: 'Reconhecido', tone: 'blue' },
  [AlertStatus.Resolvido]: { label: 'Resolvido', tone: 'green' },
};

export const TICKET_STATUS: StatusMap<TicketStatus> = {
  [TicketStatus.Aberto]: { label: 'Aberto', tone: 'outline' },
  [TicketStatus.EmDiagnostico]: { label: 'Em diagnóstico', tone: 'amber' },
  [TicketStatus.AtendimentoRemoto]: { label: 'Atendimento remoto', tone: 'blue' },
  [TicketStatus.VisitaAgendada]: { label: 'Visita agendada', tone: 'violet' },
  [TicketStatus.EmAtendimento]: { label: 'Em atendimento', tone: 'blue' },
  [TicketStatus.Resolvido]: { label: 'Resolvido', tone: 'green' },
};

export const TICKET_PRIORITY: StatusMap<TicketPriority> = {
  [TicketPriority.Baixa]: { label: 'Baixa', tone: 'neutral' },
  [TicketPriority.Media]: { label: 'Média', tone: 'blue' },
  [TicketPriority.Alta]: { label: 'Alta', tone: 'amber' },
  [TicketPriority.Critica]: { label: 'Crítica', tone: 'red' },
};

export const TICKET_KIND: StatusMap<TicketKind> = {
  [TicketKind.Corretivo]: { label: 'Corretivo', tone: 'outline' },
  [TicketKind.Incidente]: { label: 'Incidente', tone: 'red' },
  [TicketKind.Preventiva]: { label: 'Preventiva', tone: 'green' },
  [TicketKind.Substituicao]: { label: 'Substituição', tone: 'violet' },
};

export const USER_STATUS: StatusMap<UserStatus> = {
  [UserStatus.Ativo]: { label: 'Ativo', tone: 'green' },
  [UserStatus.Convidado]: { label: 'Convite enviado', tone: 'blue' },
  [UserStatus.Bloqueado]: { label: 'Bloqueado', tone: 'red' },
};

export const DEVICE_TYPE: Record<DeviceType, string> = {
  [DeviceType.Regua]: 'Régua LED',
  [DeviceType.Controlador]: 'Controlador',
  [DeviceType.Gateway]: 'Gateway',
  [DeviceType.Camera]: 'Câmera',
  [DeviceType.Sincronizacao]: 'Serviço de sincronização',
};

export const VISION_EVENT: StatusMap<VisionEventType> = {
  [VisionEventType.ForaDoLocal]: { label: 'Produto fora do local esperado', tone: 'violet' },
  [VisionEventType.BaixoEstoque]: { label: 'Baixo estoque identificado', tone: 'amber' },
  [VisionEventType.PossivelRuptura]: { label: 'Possível ruptura', tone: 'red' },
  [VisionEventType.NaoReconhecido]: { label: 'Produto não reconhecido', tone: 'neutral' },
  [VisionEventType.BaixaExposicao]: { label: 'Gôndola com baixa exposição', tone: 'blue' },
};

export const SERVICE_STAGES: { value: ServiceStage; label: string; description: string }[] = [
  { value: ServiceStage.Projeto, label: 'Projeto', description: 'Escopo, cronograma e dimensionamento da solução.' },
  { value: ServiceStage.Mapeamento, label: 'Mapeamento da loja', description: 'Levantamento de gôndolas, pontos elétricos e rede.' },
  { value: ServiceStage.Instalacao, label: 'Instalação', description: 'Réguas, controladores, gateways e câmeras.' },
  { value: ServiceStage.Configuracao, label: 'Configuração', description: 'Cadastro de gôndolas, planogramas e integrações.' },
  { value: ServiceStage.Homologacao, label: 'Homologação', description: 'Testes de carga, publicação e aceite da loja.' },
  { value: ServiceStage.GoLive, label: 'Go-live', description: 'Operação assistida nas primeiras semanas.' },
  { value: ServiceStage.Monitoramento, label: 'Monitoramento contínuo', description: 'Acompanhamento 24/7 de dispositivos e publicações.' },
  { value: ServiceStage.Suporte, label: 'Suporte', description: 'Atendimento remoto e chamados técnicos.' },
  { value: ServiceStage.Manutencao, label: 'Manutenção', description: 'Preventiva e corretiva, com substituição de equipamentos.' },
  { value: ServiceStage.Evolucao, label: 'Evolução', description: 'Novas lojas, funcionalidades e relatórios.' },
];

export const SERVICE_STAGE_LABEL = Object.fromEntries(SERVICE_STAGES.map((s) => [s.value, s.label])) as Record<ServiceStage, string>;

export const AUDIT_ACTION: StatusMap<AuditAction> = {
  [AuditAction.AlteracaoPreco]: { label: 'Alteração de preço', tone: 'blue' },
  [AuditAction.PublicacaoRegua]: { label: 'Publicação', tone: 'green' },
  [AuditAction.AjustePosicao]: { label: 'Ajuste de posição', tone: 'violet' },
  [AuditAction.AprovacaoCampanha]: { label: 'Aprovação de campanha', tone: 'green' },
  [AuditAction.CriacaoCampanha]: { label: 'Campanha', tone: 'blue' },
  [AuditAction.AprovacaoPreco]: { label: 'Aprovação de preço', tone: 'green' },
  [AuditAction.Alerta]: { label: 'Alerta', tone: 'amber' },
  [AuditAction.Chamado]: { label: 'Chamado', tone: 'amber' },
  [AuditAction.Usuario]: { label: 'Usuário', tone: 'neutral' },
  [AuditAction.Login]: { label: 'Acesso', tone: 'neutral' },
  [AuditAction.Configuracao]: { label: 'Configuração', tone: 'neutral' },
  [AuditAction.Dispositivo]: { label: 'Dispositivo', tone: 'outline' },
};

export const PRICE_SOURCE: Record<string, string> = {
  manual: 'Manual',
  massa: 'Em massa',
  importacao: 'Importação',
  regua: 'Editor de régua',
  campanha: 'Campanha',
};
