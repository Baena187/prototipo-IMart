import { useState } from 'react';
import { Dialog } from '@/components/ui/overlay';
import { SegmentedControl } from '@/components/ui/misc';
import type { Product, ProductFacing, ShelfSlot } from '@/types';
import { ShelfStrip, type PriceInfo } from './ShelfStrip';

export function ShelfPreviewDialog({
  open,
  onClose,
  title,
  widthMm,
  slots,
  publishedSlots,
  facings,
  products,
  prices,
  priceOverrides,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  widthMm: number;
  slots: ShelfSlot[];
  publishedSlots: ShelfSlot[];
  facings: ProductFacing[];
  products: Record<string, Product>;
  prices: Record<string, PriceInfo>;
  priceOverrides: Record<string, number>;
}) {
  const [mode, setMode] = useState<'novo' | 'comparar'>('novo');
  return (
    <Dialog open={open} onClose={onClose} title={`Pré-visualização · ${title}`} description="Simulação de como a régua será vista pelo cliente na prateleira." size="xl">
      <div className="mb-4">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          items={[
            { value: 'novo', label: 'Nova versão' },
            { value: 'comparar', label: 'Comparar com publicado' },
          ]}
        />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px] rounded-lg bg-slate-100 p-5">
          <ShelfStrip widthMm={widthMm} slots={slots} facings={facings} showFacings products={products} prices={prices} priceOverrides={priceOverrides} size="xl" />
          <div className="h-3 rounded-b bg-slate-300" />
          {mode === 'comparar' && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Versão publicada atualmente</p>
              <ShelfStrip widthMm={widthMm} slots={publishedSlots} products={products} prices={prices} size="lg" />
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
