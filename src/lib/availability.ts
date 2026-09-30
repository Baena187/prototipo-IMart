import type { Promoter, Settings, Tasting } from '../types';
import { addDays, diffDays, overlaps, weekday } from './dates';

export const FERIADOS: Record<string, string> = {
  '2026-10-12': 'Nossa Senhora Aparecida',
  '2026-11-02': 'Finados',
  '2026-11-15': 'Proclamação da República',
  '2026-11-20': 'Consciência Negra',
  '2026-12-08': 'Dia de Nossa Senhora da Conceição',
  '2026-12-25': 'Natal',
  '2026-12-31': 'Véspera de Ano Novo',
};

// Dias com restrição operacional simulada (treinamentos, inventário, recesso)
const ESPECIAIS: Record<string, { ausentes: number; motivo: string }> = {
  '2026-10-15': { ausentes: 7, motivo: 'Treinamento da equipe de promotores' },
  '2026-10-16': { ausentes: 8, motivo: 'Treinamento da equipe de promotores' },
  '2026-10-28': { ausentes: 10, motivo: 'Inventário geral — equipe em recesso' },
  '2026-11-27': { ausentes: 9, motivo: 'Reunião comercial anual' },
  '2026-12-24': { ausentes: 8, motivo: 'Recesso de fim de ano' },
  '2026-12-25': { ausentes: 10, motivo: 'Natal' },
  '2026-12-31': { ausentes: 10, motivo: 'Véspera de Ano Novo' },
};

const live = (t: Tasting) => t.status !== 'CANCELADA';

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function absentCount(date: string): { n: number; motivo: string } {
  const esp = ESPECIAIS[date];
  if (esp) return { n: esp.ausentes, motivo: esp.motivo };
  const wd = weekday(date);
  if (FERIADOS[date]) return { n: 6, motivo: `Feriado — ${FERIADOS[date]}` };
  if (wd === 0) return { n: 7, motivo: 'Escala reduzida aos domingos' };
  if (wd === 6) return { n: 5, motivo: 'Escala reduzida aos sábados' };
  const h = hash(date) % 11;
  if (h === 0) return { n: 3, motivo: 'Folgas programadas' };
  if (h === 1 || h === 2) return { n: 1, motivo: 'Folga programada' };
  return { n: 0, motivo: '' };
}

/** Promotores ausentes (folga/treinamento) no dia. Determinístico. */
export function absentIds(date: string, promoters: Promoter[]): { ids: Set<string>; motivo: string } {
  const active = promoters.filter((p) => p.ativo);
  const { n, motivo } = absentCount(date);
  const ids = new Set<string>();
  if (!n) return { ids, motivo };
  const pool = [...active].sort((x, y) => (hash(date + x.id) % 97) - (hash(date + y.id) % 97));
  const keepCarlos = !ESPECIAIS[date]; // Carlos Lima fica escalado, exceto em dias de treinamento/recesso
  for (const p of pool) {
    if (ids.size >= n) break;
    if (keepCarlos && p.id === 'p2') continue;
    ids.add(p.id);
  }
  return { ids, motivo };
}

export type DayState = 'disponivel' | 'poucas' | 'indisponivel' | 'passada' | 'antecedencia';

export interface DayInfo {
  date: string;
  state: DayState;
  present: number;
  booked: number;
  remaining: number;
  available: number;
  motivo: string;
}

export function dayInfo(date: string, tastings: Tasting[], promoters: Promoter[], s: Settings): DayInfo {
  const { ids, motivo } = absentIds(date, promoters);
  const active = promoters.filter((p) => p.ativo);
  const present = active.length - ids.size;
  const booked = tastings.filter((t) => t.date === date && live(t)).length;
  const slots = present * s.slotsPerPromoter;
  const remaining = Math.max(0, slots - booked);
  const available = Math.min(present, remaining);
  let state: DayState = 'disponivel';
  if (diffDays(date, s.refDate) < 0) state = 'passada';
  else if (diffDays(date, s.refDate) < s.minLeadDays) state = 'antecedencia';
  else if (present === 0 || remaining === 0) state = 'indisponivel';
  else if (remaining <= 6) state = 'poucas';
  return { date, state, present, booked, remaining, available, motivo };
}

export interface SlotCheck {
  ok: boolean;
  message?: string;
  freeCount: number;
}

export function checkSlot(
  date: string,
  start: string,
  end: string,
  codcli: string,
  tastings: Tasting[],
  promoters: Promoter[],
  ignoreId?: string,
): SlotCheck {
  const same = tastings.filter((t) => t.date === date && live(t) && t.id !== ignoreId);
  if (same.some((t) => t.codcli === codcli && overlaps(start, end, t.start, t.end)))
    return { ok: false, message: 'Este cliente já possui uma degustação programada neste período.', freeCount: 0 };
  const { ids } = absentIds(date, promoters);
  const present = promoters.filter((p) => p.ativo && !ids.has(p.id));
  const clash = same.filter((t) => overlaps(start, end, t.start, t.end));
  const busy = new Set(clash.filter((t) => t.promotorId).map((t) => t.promotorId));
  const unassigned = clash.filter((t) => !t.promotorId).length;
  const free = present.filter((p) => !busy.has(p.id)).length - unassigned;
  if (free <= 0) return { ok: false, message: 'Não há disponibilidade operacional para este horário.', freeCount: 0 };
  return { ok: true, freeCount: free };
}

export interface PromoterSlot {
  promoter: Promoter;
  available: boolean;
  label: string;
  detail: string;
  actionsDay: number;
}

export function promoterSlots(t: Tasting, tastings: Tasting[], promoters: Promoter[], clientName: (c: string) => string): PromoterSlot[] {
  const { ids } = absentIds(t.date, promoters);
  const others = tastings.filter((x) => x.id !== t.id && x.date === t.date && live(x));
  return promoters
    .filter((p) => p.ativo)
    .map((p) => {
      const mine = others.filter((x) => x.promotorId === p.id);
      const clash = mine.find((x) => overlaps(t.start, t.end, x.start, x.end));
      if (ids.has(p.id)) return { promoter: p, available: false, label: 'Indisponível', detail: 'Folga / ausência programada no dia', actionsDay: mine.length };
      if (clash)
        return {
          promoter: p,
          available: false,
          label: 'Ocupada — outra degustação',
          detail: `${clientName(clash.codcli)} · ${clash.start}–${clash.end}`,
          actionsDay: mine.length,
        };
      return {
        promoter: p,
        available: true,
        label: 'Disponível',
        detail: mine.length ? `${mine.length} ${mine.length > 1 ? 'ações' : 'ação'} no dia, sem conflito de horário` : 'Nenhuma ação no período',
        actionsDay: mine.length,
      };
    })
    .sort((a, b) => Number(b.available) - Number(a.available) || a.actionsDay - b.actionsDay);
}

export function nextAvailableDate(tastings: Tasting[], promoters: Promoter[], s: Settings): string {
  let d = addDays(s.refDate, s.minLeadDays);
  for (let i = 0; i < 120; i++, d = addDays(d, 1)) {
    const info = dayInfo(d, tastings, promoters, s);
    if (info.state === 'disponivel') return d;
  }
  return d;
}
