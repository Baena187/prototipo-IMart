import { createRng } from '@/utils/random';
import { NOW } from '@/utils/time';

const rng = createRng(77);
const pad = (n: number) => String(n).padStart(2, '0');
const dayLabel = (offset: number) => {
  const d = new Date(NOW - offset * 86_400_000);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};

export interface DailyPoint {
  label: string;
  value: number;
}

export const availabilitySeries = (): { label: string; reguas: number; cameras: number }[] =>
  Array.from({ length: 14 }, (_, i) => {
    const offset = 13 - i;
    return {
      label: dayLabel(offset),
      reguas: 99 + rng.int(20, 78) / 100,
      cameras: 97.6 + rng.int(20, 180) / 100,
    };
  });

export const priceChangesBaseSeries = (): DailyPoint[] =>
  Array.from({ length: 14 }, (_, i) => {
    const offset = 13 - i;
    const d = new Date(NOW - offset * 86_400_000);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    return { label: dayLabel(offset), value: weekend ? rng.int(90, 160) : rng.int(310, 520) };
  });

export const campaignsPublishedSeries = (): { label: string; publicadas: number; encerradas: number }[] =>
  Array.from({ length: 8 }, (_, i) => ({
    label: `Sem ${i + 1}`,
    publicadas: rng.int(3, 9),
    encerradas: rng.int(2, 7),
  }));

/** Base diária de alterações de preço vinda do ERP/integrações (demonstração). */
export const TODAY_PRICE_BASE = 412;
