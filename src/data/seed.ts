import type { Notification, Settings, Status, Tasting, TimelineEvent } from '../types';
import { addDays, fmtShort } from '../lib/dates';
import { CLIENTS, PRODUCTS, PROMOTERS, REF_DATE, SELLERS } from './catalog';

type Row = {
  d: string; s: string; e: string; c: string; b: string; p: number[]; t: string; st: Status; pr: string | null;
  att?: number; obs?: string; mat?: string[]; motivo?: string; started?: string;
};

const R: Row[] = [
  // Finalizadas
  { d: '2026-09-14', s: '09:00', e: '13:00', c: '000245', b: 'renata', p: [1, 4], t: 'preparo', st: 'FINALIZADA', pr: 'p2', att: 172, mat: ['Mesa', 'Fogareiro', 'Panela'] },
  { d: '2026-09-16', s: '14:00', e: '18:00', c: '000312', b: 'zaeli', p: [1], t: 'simples', st: 'FINALIZADA', pr: 'p1', att: 120, mat: ['Mesa', 'Copos descartáveis'] },
  { d: '2026-09-18', s: '08:00', e: '12:00', c: '000601', b: 'galo', p: [1, 3], t: 'simples', st: 'FINALIZADA', pr: 'p3', att: 98, mat: ['Mesa', 'Guardanapos'] },
  { d: '2026-09-19', s: '09:00', e: '15:00', c: '000702', b: 'vidan', p: [1, 3], t: 'sampling', st: 'FINALIZADA', pr: 'p5', att: 240, mat: ['Caixa térmica', 'Material promocional'] },
  { d: '2026-09-22', s: '14:00', e: '18:00', c: '000246', b: 'qualimax', p: [1], t: 'demonstracao', st: 'FINALIZADA', pr: 'p4', att: 85, mat: ['Mesa', 'Material promocional'] },
  { d: '2026-09-23', s: '09:00', e: '13:00', c: '000615', b: 'barao', p: [3], t: 'preparo', st: 'FINALIZADA', pr: 'p6', att: 110, mat: ['Mesa', 'Forno elétrico'] },
  { d: '2026-09-25', s: '09:00', e: '13:00', c: '000520', b: 'zaeli', p: [2, 3], t: 'preparo', st: 'FINALIZADA', pr: 'p2', att: 156, mat: ['Mesa', 'Fogareiro', 'Panela'] },
  { d: '2026-09-26', s: '10:00', e: '16:00', c: '000318', b: 'renata', p: [2], t: 'preparo', st: 'FINALIZADA', pr: 'p4', att: 205, mat: ['Mesa', 'Fogareiro', 'Panela', 'Guardanapos'] },
  { d: '2026-09-29', s: '14:00', e: '18:00', c: '000709', b: 'vidan', p: [2], t: 'simples', st: 'FINALIZADA', pr: 'p7', att: 92, mat: ['Mesa'] },
  { d: '2026-09-30', s: '09:00', e: '13:00', c: '000402', b: 'zaeli', p: [1, 5], t: 'lancamento', st: 'FINALIZADA', pr: 'p1', att: 143, mat: ['Mesa', 'Material promocional'] },
  { d: '2026-10-01', s: '09:00', e: '13:00', c: '000251', b: 'galo', p: [1], t: 'simples', st: 'FINALIZADA', pr: 'p3', att: 101, mat: ['Mesa', 'Copos descartáveis'] },
  { d: '2026-10-02', s: '14:00', e: '18:00', c: '000716', b: 'qualimax', p: [3], t: 'simples', st: 'FINALIZADA', pr: 'p8', att: 77, mat: ['Mesa'] },
  { d: '2026-10-03', s: '09:00', e: '15:00', c: '000245', b: 'vidan', p: [4], t: 'sampling', st: 'FINALIZADA', pr: 'p5', att: 260, mat: ['Caixa térmica', 'Material promocional'] },
  { d: '2026-10-06', s: '08:00', e: '12:00', c: '000608', b: 'barao', p: [1], t: 'promocional', st: 'FINALIZADA', pr: 'p10', att: 130, mat: ['Mesa', 'Material promocional'] },
  { d: '2026-10-07', s: '14:00', e: '18:00', c: '000804', b: 'renata', p: [3], t: 'preparo', st: 'FINALIZADA', pr: 'p2', att: 118, mat: ['Mesa', 'Fogareiro', 'Panela'] },
  // Canceladas
  { d: '2026-09-24', s: '09:00', e: '13:00', c: '000415', b: 'galo', p: [2], t: 'simples', st: 'CANCELADA', pr: 'p4', motivo: 'Cliente cancelou' },
  { d: '2026-10-05', s: '14:00', e: '18:00', c: '000903', b: 'zaeli', p: [4], t: 'simples', st: 'CANCELADA', pr: null, motivo: 'Alteração de data' },
  // Hoje (08/10)
  { d: '2026-10-08', s: '09:00', e: '13:00', c: '000245', b: 'renata', p: [1], t: 'preparo', st: 'CONFIRMADA', pr: 'p2', mat: ['Mesa', 'Fogareiro', 'Panela'], obs: 'Montar próximo à entrada da loja.' },
  { d: '2026-10-08', s: '09:00', e: '13:00', c: '000246', b: 'qualimax', p: [2], t: 'demonstracao', st: 'EM_ANDAMENTO', pr: 'p3', started: '09:05', mat: ['Mesa', 'Material promocional'] },
  { d: '2026-10-08', s: '14:00', e: '18:00', c: '000318', b: 'zaeli', p: [1], t: 'simples', st: 'CONFIRMADA', pr: 'p2', mat: ['Mesa', 'Copos descartáveis'] },
  { d: '2026-10-08', s: '08:00', e: '12:00', c: '000520', b: 'galo', p: [3, 4], t: 'simples', st: 'EM_ANDAMENTO', pr: 'p1', started: '08:02', mat: ['Mesa', 'Guardanapos'] },
  { d: '2026-10-08', s: '14:00', e: '18:00', c: '000709', b: 'vidan', p: [1], t: 'simples', st: 'CONFIRMADA', pr: 'p7', mat: ['Mesa'] },
  // Próximos dias
  { d: '2026-10-09', s: '09:00', e: '13:00', c: '000601', b: 'barao', p: [2], t: 'simples', st: 'CONFIRMADA', pr: 'p1', mat: ['Mesa'] },
  { d: '2026-10-09', s: '14:00', e: '18:00', c: '000608', b: 'qualimax', p: [1, 2], t: 'demonstracao', st: 'AGUARDANDO_PROMOTOR', pr: null, mat: ['Mesa', 'Material promocional'] },
  { d: '2026-10-10', s: '09:00', e: '15:00', c: '000702', b: 'zaeli', p: [1, 3], t: 'preparo', st: 'CONFIRMADA', pr: 'p2', mat: ['Mesa', 'Fogareiro', 'Panela'] },
  { d: '2026-10-10', s: '10:00', e: '14:00', c: '000246', b: 'vidan', p: [2], t: 'sampling', st: 'AGUARDANDO_PROMOTOR', pr: null, mat: ['Caixa térmica'] },
  { d: '2026-10-11', s: '14:00', e: '18:00', c: '000312', b: 'zaeli', p: [1], t: 'simples', st: 'AGUARDANDO_PROMOTOR', pr: null, mat: ['Mesa', 'Copos descartáveis'], obs: 'Domingo de maior movimento — montar na seção de molhos.' },
  { d: '2026-10-12', s: '09:00', e: '13:00', c: '000251', b: 'renata', p: [2, 3], t: 'preparo', st: 'CONFIRMADA', pr: 'p2', mat: ['Mesa', 'Fogareiro', 'Panela'] },
  { d: '2026-10-12', s: '10:00', e: '14:00', c: '000402', b: 'galo', p: [1], t: 'lancamento', st: 'SOLICITADA', pr: null, mat: ['Mesa', 'Material promocional'] },
  { d: '2026-10-14', s: '09:00', e: '13:00', c: '000245', b: 'zaeli', p: [2], t: 'simples', st: 'PROMOTOR_DEFINIDO', pr: 'p1', mat: ['Mesa', 'Copos descartáveis'] },
  { d: '2026-10-15', s: '09:00', e: '13:00', c: '000615', b: 'renata', p: [4], t: 'preparo', st: 'AGUARDANDO_PROMOTOR', pr: null, mat: ['Mesa', 'Fogareiro', 'Panela'] },
  { d: '2026-10-15', s: '14:00', e: '18:00', c: '000709', b: 'vidan', p: [2], t: 'simples', st: 'AGUARDANDO_PROMOTOR', pr: null, mat: ['Mesa'] },
  { d: '2026-10-15', s: '09:00', e: '13:00', c: '000903', b: 'qualimax', p: [5], t: 'simples', st: 'AGUARDANDO_PROMOTOR', pr: null, mat: ['Mesa'] },
  { d: '2026-10-16', s: '09:00', e: '13:00', c: '000601', b: 'zaeli', p: [1], t: 'simples', st: 'AGUARDANDO_PROMOTOR', pr: null, mat: ['Mesa'] },
  { d: '2026-10-16', s: '14:00', e: '18:00', c: '000608', b: 'renata', p: [1], t: 'preparo', st: 'AGUARDANDO_PROMOTOR', pr: null, mat: ['Mesa', 'Fogareiro', 'Panela'] },
  { d: '2026-10-16', s: '09:00', e: '13:00', c: '000702', b: 'barao', p: [2], t: 'simples', st: 'AGUARDANDO_PROMOTOR', pr: null, mat: ['Mesa'] },
  { d: '2026-10-16', s: '14:00', e: '18:00', c: '000804', b: 'vidan', p: [3], t: 'sampling', st: 'AGUARDANDO_PROMOTOR', pr: null, mat: ['Caixa térmica'] },
  { d: '2026-10-20', s: '09:00', e: '13:00', c: '000910', b: 'zaeli', p: [1], t: 'simples', st: 'CONFIRMADA', pr: 'p9', mat: ['Mesa'] },
  { d: '2026-10-22', s: '14:00', e: '18:00', c: '000716', b: 'galo', p: [2], t: 'simples', st: 'AGUARDANDO_PROMOTOR', pr: null, mat: ['Mesa'] },
  { d: '2026-10-24', s: '09:00', e: '15:00', c: '000245', b: 'renata', p: [1, 2, 3], t: 'lancamento', st: 'CONFIRMADA', pr: 'p2', mat: ['Mesa', 'Fogareiro', 'Panela', 'Material promocional'] },
  { d: '2026-10-29', s: '14:00', e: '18:00', c: '001015', b: 'qualimax', p: [3], t: 'simples', st: 'AGUARDANDO_PROMOTOR', pr: null, mat: ['Mesa'] },
];

const pName = (id: string | null) => PROMOTERS.find((p) => p.id === id)?.nome ?? '';

function build(r: Row, i: number): Tasting {
  const client = CLIENTS.find((c) => c.codcli === r.c)!;
  const seller = SELLERS.find((s) => s.id === client.vendedorId)!;
  const recent = r.st === 'SOLICITADA' ? 0 : r.st === 'AGUARDANDO_PROMOTOR' ? (i % 3) + 1 : 8;
  let created = addDays(r.d, -8);
  if (created > REF_DATE || recent < 8) created = addDays(REF_DATE, -recent);
  const createdAt = `${created}T0${8 + (i % 2)}:${(i * 7) % 6}0`;
  const at = (hh: string) => `${created}T${hh}`;
  const events: TimelineEvent[] = [{ at: createdAt, text: 'Solicitação de degustação criada', by: seller.nome }];
  const assigned = r.pr && r.st !== 'SOLICITADA' && r.st !== 'AGUARDANDO_PROMOTOR';
  if (assigned) events.push({ at: at('11:20'), text: `Promotor ${pName(r.pr)} definido`, by: 'Ana Paula Martins' });
  if (['CONFIRMADA', 'EM_ANDAMENTO', 'FINALIZADA'].includes(r.st)) events.push({ at: at('11:25'), text: 'Agendamento confirmado', by: 'Ana Paula Martins' });
  if (r.st === 'EM_ANDAMENTO') events.push({ at: `${r.d}T${r.started}`, text: `Ação iniciada às ${r.started}`, by: pName(r.pr) });
  if (r.st === 'FINALIZADA') {
    events.push({ at: `${r.d}T${r.s.slice(0, 2)}:04`, text: `Ação iniciada às ${r.s.slice(0, 2)}:04`, by: pName(r.pr) });
    events.push({ at: `${r.d}T${r.e}`, text: `Ação finalizada — ${r.att} pessoas atendidas`, by: pName(r.pr) });
  }
  if (r.st === 'CANCELADA') events.push({ at: `${addDays(r.d, -2)}T10:10`, text: `Cancelamento confirmado — ${r.motivo}`, by: 'Ana Paula Martins' });
  const finished = r.st === 'FINALIZADA';
  return {
    id: `DG-${String(1001 + i)}`,
    codcli: r.c,
    date: r.d,
    start: r.s,
    end: r.e,
    tipoId: r.t,
    brandId: r.b,
    productIds: r.p.map((n) => PRODUCTS.find((p) => p.id === `${r.b}-${n}`)!.id),
    materiais: r.mat ?? [],
    obs: r.obs ?? '',
    vendedorId: client.vendedorId,
    promotorId: r.pr,
    status: r.st,
    createdAt,
    startedAt: r.st === 'EM_ANDAMENTO' ? `${r.d}T${r.started}` : finished ? `${r.d}T${r.s.slice(0, 2)}:04` : undefined,
    finishedAt: finished ? `${r.d}T${r.e}` : undefined,
    attendees: r.att,
    finalNote: finished ? 'Ação concluída normalmente.' : undefined,
    cancelReason: r.motivo,
    cancelRequest: null,
    events: events.sort((a, b) => a.at.localeCompare(b.at)),
  };
}

export const SEED_TASTINGS: Tasting[] = R.map(build);

export const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', role: 'gestora', text: 'Nova solicitação de degustação recebida.', at: `${REF_DATE}T08:12`, read: false, tastingId: 'DG-1029' },
  { id: 'n2', role: 'gestora', text: 'Nova solicitação de degustação recebida.', at: `${addDays(REF_DATE, -1)}T16:40`, read: false, tastingId: 'DG-1026' },
  { id: 'n3', role: 'gestora', text: 'Degustação de 08/10 em andamento: Comper CPA (Juliana Santos).', at: `${REF_DATE}T09:05`, read: true, tastingId: 'DG-1019' },
  { id: 'n4', role: 'promotor', userId: 'p2', text: 'Nova degustação atribuída para 08/10 às 09:00.', at: `${addDays(REF_DATE, -2)}T17:30`, read: false, tastingId: 'DG-1018' },
  { id: 'n5', role: 'promotor', userId: 'p2', text: 'Nova degustação atribuída para 12/10 às 09:00.', at: `${addDays(REF_DATE, -1)}T11:05`, read: true, tastingId: 'DG-1028' },
  { id: 'n6', role: 'vendedor', userId: 's1', text: 'Promotor Carlos Lima definido para sua degustação de 08/10.', at: `${addDays(REF_DATE, -2)}T17:30`, read: false, tastingId: 'DG-1018' },
  { id: 'n7', role: 'vendedor', userId: 's1', text: 'Degustação de 03/10 finalizada — 260 pessoas atendidas.', at: '2026-10-03T15:02', read: true, tastingId: 'DG-1013' },
  { id: 'n8', role: 'admin', text: `Importação de clientes concluída: 245 registros válidos.`, at: `${addDays(REF_DATE, -6)}T09:00`, read: true },
];

export const SEED_SETTINGS: Settings = {
  minLeadDays: 3,
  slotsPerPromoter: 2,
  refDate: REF_DATE,
  allowStartAnyDate: true,
  operacaoInicio: '08:00',
  operacaoFim: '19:00',
  lastImport: `${fmtShort(addDays(REF_DATE, -6))}/2026`,
};
