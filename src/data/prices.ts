import { PriceChangeStatus, type PriceChange } from '@/types';
import { atDayOffset, daysAgo, hoursAgo, minutesAgo } from '@/utils/time';

type PriceSeed = [
  productId: string,
  storeId: string,
  current: number,
  next: number,
  startDays: number,
  startHour: number,
  endDays: number | undefined,
  status: PriceChangeStatus,
  requestedBy: string,
  approvedBy: string | undefined,
  createdMinutesAgo: number,
  reason: string,
  source: PriceChange['source'],
];

const S = PriceChangeStatus;

const seeds: PriceSeed[] = [
  ['p016', 'lj001', 5.49, 4.99, 0, 7, 6, S.Publicado, 'Daniel Souza', 'Marcos Tavares', 180, 'Campanha Semana Selmi', 'campanha'],
  ['p001', 'lj001', 5.29, 4.99, 0, 7, undefined, S.Publicado, 'Lucas Almeida', 'Marcos Tavares', 240, 'Ajuste de competitividade', 'manual'],
  ['p018', 'lj002', 5.49, 4.99, 0, 7, 6, S.Publicado, 'Lucas Almeida', 'Patrícia Lemos', 300, 'Campanha Semana Selmi', 'campanha'],
  ['p028', 'all', 18.9, 17.49, 1, 7, undefined, S.AguardandoAprovacao, 'Bianca Ferreira', undefined, 45, 'Reajuste de tabela do fornecedor', 'massa'],
  ['p029', 'all', 19.9, 18.49, 1, 7, undefined, S.AguardandoAprovacao, 'Bianca Ferreira', undefined, 45, 'Reajuste de tabela do fornecedor', 'massa'],
  ['p049', 'lj012', 119.9, 104.9, 0, 18, 3, S.AguardandoAprovacao, 'Rafael Costa', undefined, 30, 'Ação Pet — redução acima de 10%', 'manual'],
  ['p038', 'lj006', 0.99, 0.79, 0, 14, 20, S.Aprovado, 'Rafael Costa', 'Fernanda Rocha', 600, 'Happy Hour Refrescos', 'campanha'],
  ['p023', 'lj010', 4.49, 4.29, 0, 12, undefined, S.Aprovado, 'Bianca Ferreira', 'Carolina Mendes', 70, 'Correção de divergência PDV', 'manual'],
  ['p012', 'lj001', 3.19, 2.99, 1, 7, undefined, S.Agendado, 'Lucas Almeida', 'Marcos Tavares', 120, 'Alinhamento com encarte', 'manual'],
  ['p032', 'lj009', 13.49, 11.99, 1, 7, 7, S.Agendado, 'Bianca Ferreira', 'Carolina Mendes', 200, 'Tereré Gelado — Verão Barão', 'campanha'],
  ['p008', 'lj013', 2.49, 1.99, 0, 7, 4, S.Rascunho, 'Sérgio Pacheco', undefined, 15, 'Queima de estoque', 'manual'],
  ['p021', 'all', 7.89, 7.49, 2, 7, undefined, S.Rascunho, 'Lucas Almeida', undefined, 10, 'Preço de lançamento', 'manual'],
  ['p045', 'lj001', 24.9, 22.9, 0, 7, undefined, S.Rascunho, 'Lucas Almeida', undefined, 8, 'Food Service — condição especial', 'importacao'],
  ['p046', 'lj001', 24.9, 22.9, 0, 7, undefined, S.Rascunho, 'Lucas Almeida', undefined, 8, 'Food Service — condição especial', 'importacao'],
  ['p017', 'lj003', 5.49, 5.29, -1, 7, undefined, S.Publicado, 'Lucas Almeida', 'Rodrigo Nunes', 1500, 'Ajuste de competitividade', 'manual'],
  ['p053', 'lj007', 14.9, 13.9, -1, 7, undefined, S.Publicado, 'Rafael Costa', 'Fernanda Rocha', 1700, 'Pet Day', 'manual'],
  ['p040', 'lj008', 0.99, 0.89, -2, 7, undefined, S.Publicado, 'Rafael Costa', 'Fernanda Rocha', 2900, 'Happy Hour Refrescos', 'campanha'],
  ['p034', 'lj011', 13.49, 12.99, -2, 7, undefined, S.Rejeitado, 'Bianca Ferreira', 'Carolina Mendes', 3100, 'Ajuste regional', 'manual'],
  ['p025', 'lj004', 4.29, 3.99, 0, 7, 5, S.Publicado, 'Lucas Almeida', 'Juliana Prado', 400, 'Encarte regional', 'massa'],
  ['p024', 'lj004', 4.29, 3.99, 0, 7, 5, S.Publicado, 'Lucas Almeida', 'Juliana Prado', 400, 'Encarte regional', 'massa'],
  ['p003', 'lj005', 3.29, 3.49, 1, 7, undefined, S.AguardandoAprovacao, 'Lucas Almeida', undefined, 22, 'Reajuste de custo', 'manual'],
  ['p051', 'lj003', 34.9, 29.9, 0, 18, 2, S.AguardandoAprovacao, 'Rafael Costa', undefined, 12, 'Ação Pet — redução acima de 10%', 'manual'],
];

export const pricesSeed = (): PriceChange[] =>
  seeds.map((s, i) => {
    const variation = Math.abs((s[3] - s[2]) / s[2]) * 100;
    return {
      id: `pc-${String(i + 1).padStart(4, '0')}`,
      productId: s[0],
      storeId: s[1],
      currentPrice: s[2],
      newPrice: s[3],
      startAt: atDayOffset(s[4], s[5]),
      endAt: s[6] !== undefined ? atDayOffset(s[6], 22) : undefined,
      status: s[7],
      requestedBy: s[8],
      approvedBy: s[9],
      createdAt: s[10] > 1440 ? daysAgo(Math.round(s[10] / 1440)) : s[10] > 60 ? hoursAgo(Math.round(s[10] / 60)) : minutesAgo(s[10]),
      reason: s[11],
      requiresApproval: variation >= 10 || s[1] === 'all',
      source: s[12],
    };
  });
