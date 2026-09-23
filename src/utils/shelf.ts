import type { ProductFacing, ShelfSlot } from '@/types';

export const ALIGN_TOLERANCE_MM = 15;

export function slotCenter(slot: Pick<ShelfSlot, 'offsetMm' | 'widthMm'>) {
  return slot.offsetMm + slot.widthMm / 2;
}

/** Desvio (mm) entre o centro do bloco de preço e o centro do produto na prateleira. */
export function alignmentDelta(slot: ShelfSlot, facings: ProductFacing[]): number | null {
  if (slot.kind !== 'product' || !slot.productId) return null;
  const facing = facings.find((f) => f.productId === slot.productId);
  if (!facing) return null;
  return Math.round(slotCenter(slot) - (facing.offsetMm + facing.widthMm / 2));
}

export function isAligned(slot: ShelfSlot, facings: ProductFacing[]): boolean {
  const d = alignmentDelta(slot, facings);
  return d === null || Math.abs(d) <= ALIGN_TOLERANCE_MM;
}

export function sortSlots(slots: ShelfSlot[]): ShelfSlot[] {
  return [...slots].sort((a, b) => a.offsetMm - b.offsetMm);
}

/** Limites livres para um bloco, respeitando vizinhos e as extremidades da régua. */
export function slotBounds(slots: ShelfSlot[], id: string, shelfWidth: number) {
  const sorted = sortSlots(slots);
  const idx = sorted.findIndex((s) => s.id === id);
  const prev = sorted[idx - 1];
  const next = sorted[idx + 1];
  const min = prev ? prev.offsetMm + prev.widthMm : 0;
  const max = (next ? next.offsetMm : shelfWidth) - sorted[idx].widthMm;
  return { min, max: Math.max(min, max) };
}

export function clampOffset(slots: ShelfSlot[], id: string, offset: number, shelfWidth: number) {
  const { min, max } = slotBounds(slots, id, shelfWidth);
  return Math.round(Math.min(max, Math.max(min, offset)));
}

export function maxWidthFor(slots: ShelfSlot[], id: string, shelfWidth: number) {
  const sorted = sortSlots(slots);
  const idx = sorted.findIndex((s) => s.id === id);
  const next = sorted[idx + 1];
  return (next ? next.offsetMm : shelfWidth) - sorted[idx].offsetMm;
}

/** Troca a ordem de um bloco com o vizinho, preservando o espaço ocupado. */
export function swapWithNeighbor(slots: ShelfSlot[], id: string, direction: -1 | 1): ShelfSlot[] {
  const sorted = sortSlots(slots);
  const idx = sorted.findIndex((s) => s.id === id);
  const target = idx + direction;
  if (target < 0 || target >= sorted.length) return slots;
  const a = sorted[Math.min(idx, target)];
  const b = sorted[Math.max(idx, target)];
  const start = a.offsetMm;
  const gap = b.offsetMm - (a.offsetMm + a.widthMm);
  const newB = { ...b, offsetMm: start };
  const newA = { ...a, offsetMm: start + b.widthMm + gap };
  return sorted.map((s) => (s.id === a.id ? newA : s.id === b.id ? newB : s));
}

export function layoutsEqual(a: ShelfSlot[], b: ShelfSlot[]) {
  return JSON.stringify(sortSlots(a)) === JSON.stringify(sortSlots(b));
}
