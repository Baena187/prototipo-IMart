const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number = new Intl.NumberFormat('pt-BR');
const pad = (n: number) => String(n).padStart(2, '0');

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return currency.format(value);
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatInt(value: number): string {
  return number.format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${formatNumber(value, digits)}%`;
}

/** dd/mm/aaaa */
export function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** HH:mm */
export function formatTime(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** dd/mm/aaaa HH:mm */
export function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

export function formatRelative(iso: string | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const future = diff < 0;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60000);
  let label: string;
  if (min < 1) return future ? 'em instantes' : 'agora';
  if (min < 60) label = `${min} min`;
  else if (min < 60 * 24) label = `${Math.round(min / 60)} h`;
  else label = `${Math.round(min / 1440)} d`;
  return future ? `em ${label}` : `há ${label}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h < 24) return m ? `${h}h ${pad(m)}min` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function formatUptime(hours: number): string {
  const d = Math.floor(hours / 24);
  const h = Math.round(hours % 24);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

export function priceVariation(current: number, next: number): number {
  if (!current) return 0;
  return ((next - current) / current) * 100;
}

export function parseCurrencyInput(value: string): number {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

/** Valor para <input type="datetime-local"> no fuso local. */
export function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toDateInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
