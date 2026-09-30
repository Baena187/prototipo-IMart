export const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const MESES_CURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
export const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const DIAS_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const p2 = (n: number) => String(n).padStart(2, '0');

export function toIso(d: Date) {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}
export function parseIso(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
export function addDays(iso: string, n: number) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}
export function diffDays(a: string, b: string) {
  return Math.round((parseIso(a).getTime() - parseIso(b).getTime()) / 86400000);
}
export function weekday(iso: string) {
  return parseIso(iso).getDay();
}
export const fmtBR = (iso: string) => iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4);
export const fmtShort = (iso: string) => iso.slice(8, 10) + '/' + iso.slice(5, 7);
export const dayNum = (iso: string) => iso.slice(8, 10);
export const monthShort = (iso: string) => MESES_CURTO[Number(iso.slice(5, 7)) - 1];
export const monthKey = (iso: string) => iso.slice(0, 7);
export const fmtLong = (iso: string) => `${DIAS_SEMANA[weekday(iso)]}, ${fmtBR(iso)}`;
export const fmtStamp = (s: string) => (s.length > 10 ? `${fmtBR(s)} às ${s.slice(11, 16)}` : fmtBR(s));
export const timeOf = (s?: string) => (s ? s.slice(11, 16) : '');

export function startOfWeek(iso: string) {
  return addDays(iso, -weekday(iso));
}

export function monthCells(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1, 12);
  const lead = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${p2(month + 1)}-${p2(d)}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
export const fromMin = (m: number) => `${p2(Math.floor(m / 60))}:${p2(m % 60)}`;
export const overlaps = (s1: string, e1: string, s2: string, e2: string) => toMin(s1) < toMin(e2) && toMin(s2) < toMin(e1);
export const fmtRange = (s: string, e: string) => `${s} às ${e}`;
