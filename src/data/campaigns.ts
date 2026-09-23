import { CampaignStatus, CampaignType, type Campaign } from '@/types';
import { daysAgo, daysFromNow } from '@/utils/time';

export const CAMPAIGN_TYPE_LABEL: Record<CampaignType, string> = {
  [CampaignType.Relampago]: 'Promoção relâmpago',
  [CampaignType.PrecoPromocional]: 'Preço promocional',
  [CampaignType.DescontoHorario]: 'Desconto por horário',
  [CampaignType.OfertaSemanal]: 'Oferta semanal',
  [CampaignType.Marca]: 'Campanha de marca',
  [CampaignType.Recomendado]: 'Produto recomendado',
  [CampaignType.QueimaEstoque]: 'Queima de estoque',
  [CampaignType.Lancamento]: 'Destaque de lançamento',
};

const ALL_ACTIVE = ['lj001', 'lj002', 'lj003', 'lj004', 'lj005', 'lj006', 'lj007', 'lj008', 'lj009', 'lj010', 'lj011', 'lj012', 'lj013', 'lj014', 'lj015', 'lj017'];

export const campaignsSeed = (): Campaign[] => [
  {
    id: 'cp-001', name: 'Semana Selmi', type: CampaignType.Marca, brand: 'Renata',
    productIds: ['p016', 'p017', 'p018', 'p019', 'p023', 'p024', 'p025'], storeIds: ALL_ACTIVE,
    startDate: daysAgo(2), endDate: daysFromNow(5), startTime: '07:00', endTime: '22:00',
    layout: 'de_por', message: 'Semana Selmi: massas Renata e Galo com preço especial', priority: 'alta', color: 'vermelho', discountPct: 10,
    status: CampaignStatus.Ativa, createdBy: 'Rafael Costa', approvedBy: 'Carolina Mendes', createdAt: daysAgo(6), reach: { shelves: 212, impressions: 184300 },
  },
  {
    id: 'cp-002', name: 'Tereré Gelado — Verão Barão', type: CampaignType.OfertaSemanal, brand: 'Barão',
    productIds: ['p031', 'p032', 'p033', 'p034', 'p035'], storeIds: ['lj009', 'lj010', 'lj011', 'lj012', 'lj013'],
    startDate: daysAgo(1), endDate: daysFromNow(6), startTime: '08:00', endTime: '21:00',
    layout: 'preco_selo', message: 'Tereré Barão: leve o sabor do verão', priority: 'media', color: 'verde', discountPct: 12,
    status: CampaignStatus.Ativa, createdBy: 'Rafael Costa', approvedBy: 'Carolina Mendes', createdAt: daysAgo(4), reach: { shelves: 64, impressions: 41200 },
  },
  {
    id: 'cp-003', name: 'Relâmpago Maizena 17h–19h', type: CampaignType.Relampago, brand: 'Zaeli',
    productIds: ['p001', 'p002'], storeIds: ['lj001', 'lj002', 'lj017'],
    startDate: daysAgo(0), endDate: daysFromNow(0), startTime: '17:00', endTime: '19:00',
    layout: 'faixa', message: 'Só até as 19h: Zaeli Maizena com desconto', priority: 'alta', color: 'vermelho', discountPct: 15,
    status: CampaignStatus.Agendada, createdBy: 'Lucas Almeida', approvedBy: 'Marcos Tavares', createdAt: daysAgo(1), reach: { shelves: 9, impressions: 0 },
  },
  {
    id: 'cp-004', name: 'Happy Hour Refrescos', type: CampaignType.DescontoHorario, brand: 'Qualimax',
    productIds: ['p038', 'p039', 'p040', 'p041', 'p042', 'p043'], storeIds: ['lj006', 'lj007', 'lj008'],
    startDate: daysAgo(10), endDate: daysFromNow(20), startTime: '14:00', endTime: '17:00',
    layout: 'selo_lateral', message: 'Das 14h às 17h: refrescos Qualimax por R$ 0,79', priority: 'media', color: 'amarelo', discountPct: 20,
    status: CampaignStatus.Ativa, createdBy: 'Rafael Costa', approvedBy: 'Fernanda Rocha', createdAt: daysAgo(12), reach: { shelves: 27, impressions: 66800 },
  },
  {
    id: 'cp-005', name: 'Lançamento Tereré Abacaxi', type: CampaignType.Lancamento, brand: 'Barão',
    productIds: ['p035'], storeIds: ALL_ACTIVE,
    startDate: daysFromNow(3), endDate: daysFromNow(33), startTime: '07:00', endTime: '22:00',
    layout: 'preco_selo', message: 'Novidade Barão: Tereré Abacaxi com Hortelã', priority: 'media', color: 'verde', discountPct: 0,
    status: CampaignStatus.AguardandoAprovacao, createdBy: 'Rafael Costa', createdAt: daysAgo(1), reach: { shelves: 0, impressions: 0 },
  },
  {
    id: 'cp-006', name: 'Vidan Pet — Recomendado', type: CampaignType.Recomendado, brand: 'Vidan',
    productIds: ['p049', 'p051', 'p053', 'p054'], storeIds: ['lj001', 'lj003', 'lj006', 'lj012'],
    startDate: daysAgo(15), endDate: daysFromNow(15), startTime: '07:00', endTime: '22:00',
    layout: 'selo_lateral', message: 'Recomendado pelo veterinário', priority: 'baixa', color: 'azul', discountPct: 0,
    status: CampaignStatus.Ativa, createdBy: 'Rafael Costa', approvedBy: 'Carolina Mendes', createdAt: daysAgo(18), reach: { shelves: 18, impressions: 52900 },
  },
  {
    id: 'cp-007', name: 'Queima de estoque — Biscoitos Morango', type: CampaignType.QueimaEstoque, brand: 'Zaeli',
    productIds: ['p009'], storeIds: ['lj013', 'lj014'],
    startDate: daysAgo(3), endDate: daysFromNow(4), startTime: '07:00', endTime: '22:00',
    layout: 'de_por', message: 'Últimas unidades com preço reduzido', priority: 'media', color: 'vermelho', discountPct: 30,
    status: CampaignStatus.Pausada, createdBy: 'Bianca Ferreira', approvedBy: 'Carolina Mendes', createdAt: daysAgo(5), reach: { shelves: 4, impressions: 5100 },
  },
  {
    id: 'cp-008', name: 'Oferta da Semana — Molhos Zaeli', type: CampaignType.OfertaSemanal, brand: 'Zaeli',
    productIds: ['p012', 'p013', 'p014'], storeIds: ALL_ACTIVE,
    startDate: daysAgo(9), endDate: daysAgo(2), startTime: '07:00', endTime: '22:00',
    layout: 'de_por', message: 'Molhos Zaeli em oferta', priority: 'media', color: 'vermelho', discountPct: 15,
    status: CampaignStatus.Encerrada, createdBy: 'Rafael Costa', approvedBy: 'Carolina Mendes', createdAt: daysAgo(14), reach: { shelves: 96, impressions: 211400 },
  },
  {
    id: 'cp-009', name: 'Food Service — Refrescos 1kg', type: CampaignType.PrecoPromocional, brand: 'Qualimax',
    productIds: ['p045', 'p046', 'p047'], storeIds: ['lj001', 'lj006', 'lj009', 'lj012'],
    startDate: daysFromNow(1), endDate: daysFromNow(15), startTime: '07:00', endTime: '22:00',
    layout: 'preco_selo', message: 'Para o seu negócio: refrescos 1kg', priority: 'baixa', color: 'azul', discountPct: 8,
    status: CampaignStatus.Agendada, createdBy: 'Rafael Costa', approvedBy: 'Carolina Mendes', createdAt: daysAgo(3), reach: { shelves: 0, impressions: 0 },
  },
  {
    id: 'cp-010', name: 'Chimarrão de Inverno', type: CampaignType.Marca, brand: 'Barão',
    productIds: ['p028', 'p029', 'p030'], storeIds: ['lj012', 'lj013', 'lj016'],
    startDate: daysFromNow(10), endDate: daysFromNow(40), startTime: '07:00', endTime: '22:00',
    layout: 'faixa', message: 'Chimarrão Barão: tradição que aquece', priority: 'media', color: 'verde', discountPct: 10,
    status: CampaignStatus.Rascunho, createdBy: 'Tatiane Borges', createdAt: daysAgo(0), reach: { shelves: 0, impressions: 0 },
  },
  {
    id: 'cp-011', name: 'Galo Instantâneo — Leve 3', type: CampaignType.PrecoPromocional, brand: 'Galo',
    productIds: ['p027'], storeIds: ['lj004', 'lj005', 'lj015'],
    startDate: daysAgo(4), endDate: daysFromNow(10), startTime: '07:00', endTime: '22:00',
    layout: 'preco_selo', message: 'Leve 3 e pague R$ 3,99', priority: 'baixa', color: 'amarelo', discountPct: 21,
    status: CampaignStatus.Ativa, createdBy: 'Lucas Almeida', approvedBy: 'Marcos Tavares', createdAt: daysAgo(6), reach: { shelves: 11, impressions: 23800 },
  },
  {
    id: 'cp-012', name: 'Lançamento Renata Integral', type: CampaignType.Lancamento, brand: 'Renata',
    productIds: ['p021'], storeIds: ['lj001', 'lj002', 'lj006', 'lj007'],
    startDate: daysAgo(20), endDate: daysFromNow(10), startTime: '07:00', endTime: '22:00',
    layout: 'selo_lateral', message: 'Novo: Espaguete Integral Renata', priority: 'media', color: 'grafite', discountPct: 0,
    status: CampaignStatus.Ativa, createdBy: 'Rafael Costa', approvedBy: 'Carolina Mendes', createdAt: daysAgo(22), reach: { shelves: 16, impressions: 71300 },
  },
  {
    id: 'cp-013', name: 'Pet Day — Gatos', type: CampaignType.Relampago, brand: 'Vidan',
    productIds: ['p053', 'p054'], storeIds: ['lj002', 'lj007'],
    startDate: daysFromNow(6), endDate: daysFromNow(6), startTime: '09:00', endTime: '12:00',
    layout: 'faixa', message: 'Pet Day: rações para gatos com desconto', priority: 'alta', color: 'vermelho', discountPct: 15,
    status: CampaignStatus.AguardandoAprovacao, createdBy: 'Rafael Costa', createdAt: daysAgo(0), reach: { shelves: 0, impressions: 0 },
  },
];
