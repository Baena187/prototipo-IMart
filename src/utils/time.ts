/** Referência de "agora" para os mocks: datas são relativas ao momento de carga. */
export const NOW = Date.now();

export const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();
export const hoursAgo = (h: number) => minutesAgo(h * 60);
export const daysAgo = (d: number) => minutesAgo(d * 1440);
export const daysFromNow = (d: number) => new Date(NOW + d * 86_400_000).toISOString();
export const hoursFromNow = (h: number) => new Date(NOW + h * 3_600_000).toISOString();

export function atDayOffset(days: number, hour: number, minute = 0): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const uid = (prefix = 'id') =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
