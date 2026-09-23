import { ArrowLeft, ArrowLeftRight, ArrowRight, ChevronsLeft, ChevronsRight, Crosshair, ExternalLink, TextAlignCenter, TextAlignEnd, TextAlignStart, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductThumb } from '@/components/shared/ProductThumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Switch } from '@/components/ui/form';
import { SegmentedControl } from '@/components/ui/misc';
import type { Product, ProductFacing, ShelfSlot, SlotAlign } from '@/types';
import { cn } from '@/utils/cn';
import { formatCurrency, formatPercent, priceVariation } from '@/utils/format';
import { alignmentDelta, ALIGN_TOLERANCE_MM } from '@/utils/shelf';
import type { PriceInfo } from './ShelfStrip';

interface Props {
  slot: ShelfSlot;
  product?: Product;
  price?: PriceInfo;
  newPrice?: number;
  facings: ProductFacing[];
  maxWidth: number;
  step: number;
  readOnly: boolean;
  approvalThreshold: number | null;
  onChange: (patch: Partial<ShelfSlot>) => void;
  onNudge: (direction: -1 | 1) => void;
  onSwap: (direction: -1 | 1) => void;
  onAlign: () => void;
  onPrice: (value: number | undefined) => void;
  onRemove: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 px-4 py-4 last:border-0">
      <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</h4>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function SlotInspector({ slot, product, price, newPrice, facings, maxWidth, step, readOnly, approvalThreshold, onChange, onNudge, onSwap, onAlign, onPrice, onRemove }: Props) {
  const delta = alignmentDelta(slot, facings);
  const current = price?.price ?? 0;
  const variation = newPrice !== undefined ? priceVariation(current, newPrice) : 0;
  const needsApproval = approvalThreshold !== null && newPrice !== undefined && Math.abs(variation) >= approvalThreshold;

  return (
    <div className="text-sm">
      {slot.kind === 'product' && product ? (
        <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4">
          <ProductThumb brand={product.brand} color={product.color} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{product.shortName}</p>
            <p className="text-xs text-slate-500">{product.description}</p>
            <Link to={`/produtos?produto=${product.id}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
              Ver no catálogo <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="border-b border-slate-100 px-4 py-4">
          <p className="font-semibold text-slate-900">{slot.kind === 'badge' ? 'Selo' : 'Mensagem'}</p>
          <p className="text-xs text-slate-500">Elemento informativo da régua</p>
        </div>
      )}

      {slot.kind === 'product' && product && (
        <Section title="Produto e preço">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500">Produto</p>
              <p className="mt-0.5 truncate text-slate-900">{product.brand}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">SKU</p>
              <p className="mt-0.5 font-mono text-[13px] text-slate-900">{product.sku}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Preço atual</p>
              <p className="mt-0.5 font-semibold tabular-nums text-slate-900">{formatCurrency(current)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Preço anterior</p>
              <p className="mt-0.5 tabular-nums text-slate-500">{formatCurrency(price?.previousPrice)}</p>
            </div>
          </div>
          <Field
            label="Novo preço"
            htmlFor="new-price"
            hint={
              newPrice !== undefined ? (
                <span className={cn(variation < 0 ? 'text-emerald-700' : 'text-red-700')}>
                  Variação de {variation > 0 ? '+' : ''}
                  {formatPercent(variation)}
                  {needsApproval && ' · exigirá aprovação de gerente'}
                </span>
              ) : (
                'Deixe em branco para manter o preço atual.'
              )
            }
          >
            <div className="flex gap-2">
              <Input
                id="new-price"
                type="number"
                step="0.01"
                min="0"
                disabled={readOnly}
                placeholder={current.toFixed(2)}
                value={newPrice ?? ''}
                onChange={(e) => onPrice(e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)))}
                className="tabular-nums"
              />
              {newPrice !== undefined && (
                <Button variant="outline" size="md" onClick={() => onPrice(undefined)} disabled={readOnly}>
                  Limpar
                </Button>
              )}
            </div>
          </Field>
        </Section>
      )}

      {slot.kind !== 'product' && (
        <Section title="Conteúdo">
          <Field label="Texto exibido" htmlFor="slot-text">
            <Input id="slot-text" maxLength={24} disabled={readOnly} value={slot.text ?? ''} onChange={(e) => onChange({ text: e.target.value.toUpperCase() })} />
          </Field>
        </Section>
      )}

      <Section title="Posição na régua">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Posição</span>
          <span className="font-mono text-[13px] tabular-nums text-slate-900">{slot.offsetMm} mm</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="px-2 text-[13px]" onClick={() => onNudge(-1)} disabled={readOnly}>
            <ArrowLeft /> Mover para esquerda
          </Button>
          <Button variant="outline" className="px-2 text-[13px]" onClick={() => onNudge(1)} disabled={readOnly}>
            Mover para direita <ArrowRight />
          </Button>
        </div>
        <p className="text-xs text-slate-500">Passo de {step} mm · use também as setas do teclado ou arraste o bloco.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" onClick={() => onSwap(-1)} disabled={readOnly}>
            <ChevronsLeft /> Trocar com anterior
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onSwap(1)} disabled={readOnly}>
            Trocar com próximo <ChevronsRight />
          </Button>
        </div>
        {delta !== null && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-[13px]',
              Math.abs(delta) <= ALIGN_TOLERANCE_MM ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900',
            )}
          >
            <Crosshair className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              {Math.abs(delta) <= ALIGN_TOLERANCE_MM ? 'Preço alinhado abaixo do produto.' : `Desvio de ${delta > 0 ? '+' : ''}${delta} mm em relação ao produto.`}
            </span>
            {Math.abs(delta) > ALIGN_TOLERANCE_MM && (
              <Button size="sm" variant="outline" onClick={onAlign} disabled={readOnly}>
                Alinhar
              </Button>
            )}
          </div>
        )}
      </Section>

      <Section title="Aparência">
        <Field label={`Largura do bloco · ${slot.widthMm} mm`} htmlFor="slot-width">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="h-4 w-4 text-slate-400" />
            <input
              id="slot-width"
              type="range"
              min={60}
              max={Math.max(60, maxWidth)}
              step={5}
              disabled={readOnly}
              value={slot.widthMm}
              onChange={(e) => onChange({ widthMm: Number(e.target.value) })}
              className="h-1.5 flex-1 cursor-pointer accent-brand-700"
            />
          </div>
        </Field>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-slate-700">Alinhamento</span>
          <SegmentedControl<SlotAlign>
            size="sm"
            value={slot.align}
            onChange={(align) => !readOnly && onChange({ align })}
            items={[
              { value: 'left', label: <TextAlignStart />, title: 'Esquerda' },
              { value: 'center', label: <TextAlignCenter />, title: 'Centro' },
              { value: 'right', label: <TextAlignEnd />, title: 'Direita' },
            ]}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-slate-700">Destaque</p>
            <p className="text-xs text-slate-500">Preço em amarelo com contorno</p>
          </div>
          <Switch label="Destaque" disabled={readOnly} checked={slot.highlight === 'destaque'} onChange={(c) => onChange({ highlight: c ? 'destaque' : 'none' })} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-slate-700">Promoção</p>
            <p className="text-xs text-slate-500">
              {slot.kind === 'product' && product?.promoPrice ? `Exibe preço promocional ${formatCurrency(product.promoPrice)}` : 'Fundo vermelho de oferta'}
            </p>
          </div>
          <Switch label="Promoção" disabled={readOnly} checked={slot.highlight === 'promo'} onChange={(c) => onChange({ highlight: c ? 'promo' : 'none' })} />
        </div>
        {slot.kind === 'product' && (
          <Checkbox disabled={readOnly} checked={slot.showPreviousPrice} onChange={(c) => onChange({ showPreviousPrice: c })} label={<span className="text-[13px]">Exibir preço anterior (“de/por”)</span>} />
        )}
        {slot.highlight === 'promo' && slot.kind === 'product' && !product?.promoPrice && (
          <Badge tone="amber">Produto sem preço promocional cadastrado</Badge>
        )}
      </Section>

      <div className="px-4 py-4">
        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onRemove} disabled={readOnly}>
          <Trash /> Remover bloco da régua
        </Button>
      </div>
    </div>
  );
}
