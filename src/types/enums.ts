export enum StoreStatus {
  Normal = 'normal',
  Atencao = 'atencao',
  Critico = 'critico',
  Implantacao = 'implantacao',
}

export enum DeviceStatus {
  Online = 'online',
  Atencao = 'atencao',
  Offline = 'offline',
  Manutencao = 'manutencao',
}

export enum DeviceType {
  Regua = 'regua',
  Controlador = 'controlador',
  Gateway = 'gateway',
  Camera = 'camera',
  Sincronizacao = 'sincronizacao',
}

export enum ContentStatus {
  Publicado = 'publicado',
  Rascunho = 'rascunho',
  Agendado = 'agendado',
}

export enum ProductStatus {
  Ativo = 'ativo',
  Inativo = 'inativo',
  Lancamento = 'lancamento',
}

export enum PriceChangeStatus {
  Rascunho = 'rascunho',
  AguardandoAprovacao = 'aguardando_aprovacao',
  Aprovado = 'aprovado',
  Agendado = 'agendado',
  Publicado = 'publicado',
  Rejeitado = 'rejeitado',
}

export enum CampaignType {
  Relampago = 'relampago',
  PrecoPromocional = 'preco_promocional',
  DescontoHorario = 'desconto_horario',
  OfertaSemanal = 'oferta_semanal',
  Marca = 'marca',
  Recomendado = 'recomendado',
  QueimaEstoque = 'queima_estoque',
  Lancamento = 'lancamento',
}

export enum CampaignStatus {
  Rascunho = 'rascunho',
  AguardandoAprovacao = 'aguardando_aprovacao',
  Agendada = 'agendada',
  Ativa = 'ativa',
  Pausada = 'pausada',
  Encerrada = 'encerrada',
}

export enum AlertSeverity {
  Informativo = 'informativo',
  Atencao = 'atencao',
  Critico = 'critico',
}

export enum AlertStatus {
  Aberto = 'aberto',
  Reconhecido = 'reconhecido',
  Resolvido = 'resolvido',
}

export enum AlertCategory {
  Dispositivo = 'dispositivo',
  Estoque = 'estoque',
  Posicionamento = 'posicionamento',
  Publicacao = 'publicacao',
  Camera = 'camera',
}

export enum VisionEventType {
  ForaDoLocal = 'fora_do_local',
  BaixoEstoque = 'baixo_estoque',
  PossivelRuptura = 'possivel_ruptura',
  NaoReconhecido = 'nao_reconhecido',
  BaixaExposicao = 'baixa_exposicao',
}

export enum TicketStatus {
  Aberto = 'aberto',
  EmDiagnostico = 'em_diagnostico',
  AtendimentoRemoto = 'atendimento_remoto',
  VisitaAgendada = 'visita_agendada',
  EmAtendimento = 'em_atendimento',
  Resolvido = 'resolvido',
}

export enum TicketPriority {
  Baixa = 'baixa',
  Media = 'media',
  Alta = 'alta',
  Critica = 'critica',
}

export enum TicketKind {
  Corretivo = 'corretivo',
  Incidente = 'incidente',
  Preventiva = 'preventiva',
  Substituicao = 'substituicao',
}

export enum UserRole {
  AdminImart = 'admin_imart',
  AdminCliente = 'admin_cliente',
  GerenteLoja = 'gerente_loja',
  Operador = 'operador',
  Marketing = 'marketing',
  Suporte = 'suporte',
  Tecnico = 'tecnico',
  Visualizacao = 'visualizacao',
}

export enum UserStatus {
  Ativo = 'ativo',
  Convidado = 'convidado',
  Bloqueado = 'bloqueado',
}

export enum AuditAction {
  AlteracaoPreco = 'alteracao_preco',
  PublicacaoRegua = 'publicacao_regua',
  AjustePosicao = 'ajuste_posicao',
  AprovacaoCampanha = 'aprovacao_campanha',
  CriacaoCampanha = 'criacao_campanha',
  AprovacaoPreco = 'aprovacao_preco',
  Alerta = 'alerta',
  Chamado = 'chamado',
  Usuario = 'usuario',
  Login = 'login',
  Configuracao = 'configuracao',
  Dispositivo = 'dispositivo',
}

export enum ServiceStage {
  Projeto = 'projeto',
  Mapeamento = 'mapeamento',
  Instalacao = 'instalacao',
  Configuracao = 'configuracao',
  Homologacao = 'homologacao',
  GoLive = 'go_live',
  Monitoramento = 'monitoramento',
  Suporte = 'suporte',
  Manutencao = 'manutencao',
  Evolucao = 'evolucao',
}

export type Permission =
  | 'dashboard.view'
  | 'stores.view'
  | 'stores.manage'
  | 'gondolas.view'
  | 'gondolas.manage'
  | 'shelves.edit'
  | 'shelves.publish'
  | 'products.view'
  | 'products.manage'
  | 'prices.view'
  | 'prices.edit'
  | 'prices.approve'
  | 'prices.publish'
  | 'campaigns.view'
  | 'campaigns.edit'
  | 'campaigns.approve'
  | 'monitoring.view'
  | 'devices.manage'
  | 'cameras.view'
  | 'alerts.view'
  | 'alerts.manage'
  | 'operations.view'
  | 'operations.manage'
  | 'audit.view'
  | 'users.view'
  | 'users.manage'
  | 'settings.manage'
  | 'contract.view';
