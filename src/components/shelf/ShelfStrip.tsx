import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { Product, ProductFacing, ShelfSlot } from '@/types';
import { cn } from '@/utils/cn';
import { alignmentDelta, ALIGN_TOLERANCE_MM, slotCenter } from '@/utils/shelf';

export interface PriceInfo {
  price: number;
  previousPrice: number;
  promoPrice?: number;
}

export type StripSize = 'xs' | 'sm' | 'lg' | 'xl';

interface ShelfStripProps {
  widthMm: number;
  slots: ShelfSlot[];
  products: Record<string, Product>;
  prices: Record<string, PriceInfo>;
  priceOverrides?: Record<string, number>;
  facings?: ProductFacing[];
  showFacings?: boolean;
  showGuides?: boolean;
  showRuler?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onDrag?: (id: string, offsetMm: number) => void;
  onDragEnd?: () => void;
  size?: StripSize;
  offline?: boolean;
  className?: string;
  promoColor?: PromoColor;
}

export type PromoColor = 'vermelho' | 'azul' | 'grafite' | 'verde' | 'amarelo';

export const PROMO_BG: Record<PromoColor, string> = {
  vermelho: 'bg-red-600',
  azul: 'bg-blue-700',
  grafite: 'bg-slate-600',
  verde: 'bg-emerald-700',
  amarelo: 'bg-yellow-600',
};

const pct = (mm: number, total: number) => `${(mm / total) * 100}%`;

function splitPrice(value: number) {
  const [int, cents] = value.toFixed(2).split('.');
  return { int, cents };
}

export function LedPrice({ value, size, tone = 'white' }: { value: number; size: StripSize; tone?: 'white' | 'amber' }) {
  const { int, cents } = splitPrice(value);
  return (
    <span className={cn('inline-flex items-start font-semibold leading-none tabular-nums', tone === 'amber' ? 'text-amber-300' : 'text-white')}>
      <span className={cn('mr-0.5 font-medium opacity-80', size === 'xs' ? 'text-[7px]' : size === 'sm' ? 'mt-0.5 text-[9px]' : size === 'lg' ? 'mt-1 text-[11px]' : 'mt-1 text-sm')}>R$</span>
      <span className={cn(size === 'xs' ? 'text-[11px]' : size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-[26px]' : 'text-[34px]')}>{int}</span>
      <span className={cn(size === 'xs' ? 'text-[7px]' : size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'mt-0.5 text-sm' : 'mt-1 text-lg')}>,{cents}</span>
    </span>
  );
}

export function ShelfStrip({
  widthMm,
  slots,
  products,
  prices,
  priceOverrides = {},
  facings = [],
  showFacings,
  showGuides,
  showRuler,
  selectedId,
  onSelect,
  onDrag,
  onDragEnd,
  size = 'lg',
  offline,
  className,
  promoColor = 'vermelho',
}: ShelfStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const interactive = !!onSelect;
  const heights: Record<StripSize, string> = { xs: 'h-6', sm: 'h-9', lg: 'h-[72px]', xl: 'h-[96px]' };

  const startDrag = (e: ReactPointerEvent, slot: ShelfSlot) => {
    onSelect?.(slot.id);
    if (!onDrag || !stripRef.current) return;
    e.preventDefault();
    const rect = stripRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startOffset = slot.offsetMm;
    let moved = false;
    const move = (ev: PointerEvent) => {
      const dxMm = ((ev.clientX - startX) / rect.width) * widthMm;
      if (Math.abs(dxMm) > 2) moved = true;
      if (moved) onDrag(slot.id, Math.round((startOffset + dxMm) / 5) * 5);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (moved) onDragEnd?.();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const selected = slots.find((s) => s.id === selectedId);
  const selectedFacing = selected?.productId ? facings.find((f) => f.productId === selected.productId) : undefined;
  const delta = selected ? alignmentDelta(selected, facings) : null;

  return (
    <div className={cn('select-none', className)}>
      {showFacings && (
        <div className="relative h-[92px] rounded-t-md border border-b-0 border-slate-200 bg-[repeating-linear-gradient(90deg,#f8fafc_0,#f8fafc_49px,#eef2f6_49px,#eef2f6_50px)]">
          {facings.map((f) => {
            const p = products[f.productId];
            const isSel = selected?.productId === f.productId;
            return (
              <div
                key={f.productId + f.offsetMm}
                className={cn('absolute bottom-0 flex h-[84px] items-end gap-[3px] px-[3px] transition-opacity', selected && !isSel && 'opacity-45')}
                style={{ left: pct(f.offsetMm, widthMm), width: pct(f.widthMm, widthMm) }}
                title={p?.shortName}
              >
                {Array.from({ length: Math.max(1, Math.floor(f.widthMm / 80)) }).map((_, i) => (
                  <div key={i} className="relative flex h-full flex-1 flex-col items-center justify-start overflow-hidden rounded-t-[3px] border border-black/10" style={{ backgroundColor: p?.color ?? '#94a3b8' }}>
                    <div className="mt-3 h-4 w-[70%] rounded-sm bg-white/85" />
                    <div className="mt-1.5 h-1 w-[50%] rounded-full bg-white/50" />
                  </div>
                ))}
                <span className="absolute left-1 top-1 max-w-[calc(100%-8px)] truncate rounded bg-white/90 px-1 text-[10px] font-medium text-slate-700 shadow-sm">
                  {p?.shortName}
                </span>
              </div>
            );
          })}
          {showGuides && selectedFacing && selected && (
            <>
              <div
                className="pointer-events-none absolute bottom-0 top-0 w-px border-l border-dashed border-slate-500"
                style={{ left: pct(selectedFacing.offsetMm + selectedFacing.widthMm / 2, widthMm) }}
              />
            </>
          )}
        </div>
      )}

      <div
        ref={stripRef}
        className={cn(
          'relative overflow-hidden border-y-4 border-y-[#2a2f36] bg-[#0f1216]',
          showFacings ? 'rounded-b-md' : 'rounded-md',
          heights[size],
          offline && 'opacity-60 grayscale',
        )}
      >
        {slots.map((slot) => {
          const product = slot.productId ? products[slot.productId] : undefined;
          const info = slot.productId ? prices[slot.productId] : undefined;
          const base = slot.productId ? priceOverrides[slot.productId] ?? info?.price ?? 0 : 0;
          const isPromo = slot.highlight === 'promo';
          const shown = isPromo && slot.kind === 'product' && info?.promoPrice ? info.promoPrice : base;
          const previous = isPromo ? base : info?.previousPrice;
          const isSel = slot.id === selectedId;
          const misaligned = showGuides && slot.kind === 'product' && Math.abs(alignmentDelta(slot, facings) ?? 0) > ALIGN_TOLERANCE_MM;
          const justify = slot.align === 'left' ? 'justify-start' : slot.align === 'right' ? 'justify-end' : 'justify-center';
          const small = size === 'xs' || size === 'sm';

          return (
            <div
              key={slot.id}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={product?.shortName ?? slot.text}
              onPointerDown={interactive ? (e) => startDrag(e, slot) : undefined}
              onKeyDown={interactive ? (e) => e.key === 'Enter' && onSelect?.(slot.id) : undefined}
              className={cn(
                'absolute inset-y-0 flex items-center gap-2 overflow-hidden px-2',
                justify,
                interactive && 'cursor-grab active:cursor-grabbing',
                isPromo && PROMO_BG[promoColor],
                slot.highlight === 'destaque' && 'bg-[#1b222b] shadow-[inset_0_0_0_1px_rgba(252,211,77,0.55)]',
                isSel && 'z-10 outline outline-2 -outline-offset-2 outline-sky-400',
                !isSel && misaligned && 'outline outline-1 -outline-offset-1 outline-dashed outline-amber-400/80',
                (small || slot.kind !== 'product') && 'gap-1 px-1',
              )}
              style={{ left: pct(slot.offsetMm, widthMm), width: pct(slot.widthMm, widthMm) }}
            >
              {slot.kind === 'product' && product && !small && (
                <div
                  className={cn(
                    'flex min-w-0 max-w-full flex-col',
                    slot.align === 'left' ? 'items-start' : slot.align === 'right' ? 'items-end' : 'items-center',
                  )}
                >
                  <div className={cn('max-w-full truncate font-medium uppercase leading-tight text-white/85', size === 'xl' ? 'text-[12px]' : 'text-[10px]')}>
                    {isPromo ? 'Oferta · ' : ''}
                    {product.shortName}
                  </div>
                  <div className="mt-1 flex items-end gap-1.5">
                    {slot.showPreviousPrice && previous !== undefined && previous > shown && (
                      <span className={cn('mb-0.5 text-white/60 line-through tabular-nums', size === 'xl' ? 'text-xs' : 'text-[10px]')}>{previous.toFixed(2).replace('.', ',')}</span>
                    )}
                    <LedPrice value={shown} size={size} tone={slot.highlight === 'destaque' ? 'amber' : 'white'} />
                    {!slot.showPreviousPrice && size === 'xl' && <span className="mb-1 text-[10px] text-white/45">{product.unit}</span>}
                  </div>
                </div>
              )}
              {slot.kind === 'product' && product && small && (
                <>
                  {size === 'sm' && <div className="min-w-0 shrink truncate text-[8px] font-medium uppercase leading-tight text-white/85">{product.shortName}</div>}
                  <div className="shrink-0">
                    <LedPrice value={shown} size={size} tone={slot.highlight === 'destaque' ? 'amber' : 'white'} />
                  </div>
                </>
              )}
              {slot.kind !== 'product' && (
                <span
                  className={cn(
                    'font-bold uppercase',
                    small ? 'truncate' : 'line-clamp-2 text-center leading-tight',
                    isPromo ? 'text-white' : 'text-amber-300',
                    small ? 'text-[8px] tracking-normal' : size === 'xl' ? 'text-base' : 'text-[11px] tracking-wide',
                  )}
                >
                  {slot.text}
                </span>
              )}
            </div>
          );
        })}
        {offline && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[11px] font-medium uppercase tracking-wider text-white/80">Sem comunicação</div>
        )}
        {showGuides && selected && selectedFacing && (
          <div
            className="pointer-events-none absolute inset-y-0 w-px border-l border-dashed border-sky-300/70"
            style={{ left: pct(slotCenter(selected), widthMm) }}
          />
        )}
      </div>

      {showGuides && selected && delta !== null && selectedFacing && (
        <div className="relative h-5">
          <div
            className={cn(
              'absolute top-1 -translate-x-1/2 whitespace-nowrap rounded px-1.5 text-[11px] font-medium',
              Math.abs(delta) <= ALIGN_TOLERANCE_MM ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800',
            )}
            style={{ left: pct(slotCenter(selected), widthMm) }}
          >
            {Math.abs(delta) <= ALIGN_TOLERANCE_MM ? 'Alinhado ao produto' : `Desvio de ${delta > 0 ? '+' : ''}${delta} mm`}
          </div>
        </div>
      )}

      {showRuler && (
        <div className="relative mt-1 h-5 text-[10px] text-slate-400">
          {Array.from({ length: Math.floor(widthMm / 100) + 1 }).map((_, i) => (
            <div key={i} className="absolute top-0" style={{ left: pct(i * 100, widthMm) }}>
              <div className={cn('w-px bg-slate-300', i % 5 === 0 ? 'h-2.5' : 'h-1.5')} />
              {i % 5 === 0 && <span className="absolute left-0 top-2.5 -translate-x-1/2 tabular-nums">{i * 100}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
