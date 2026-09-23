import { FileUp, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { SegmentedControl } from '@/components/ui/misc';
import { Dialog } from '@/components/ui/overlay';
import { useToast } from '@/contexts/ToastContext';
import { BRANDS, CATEGORIES } from '@/data/products';
import { catalogService, needsApproval, pricesService, storesService, type PriceChangeInput } from '@/services';
import type { Product } from '@/types';
import { cn } from '@/utils/cn';
import { formatCurrency, formatPercent, priceVariation, toDateTimeLocal } from '@/utils/format';

function ProductSelect({ value, onChange, products }: { value: string; onChange: (v: string) => void; products: Product[] }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Selecione um produto…</option>
      {BRANDS.map((b) => (
        <optgroup key={b} label={b}>
          {products
            .filter((p) => p.brand === b)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.shortName} · {p.sku}
              </option>
            ))}
        </optgroup>
      ))}
    </Select>
  );
}

function StoreSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">Todas as lojas</option>
      {storesService.listSync().map((s) => (
        <option key={s.id} value={s.id}>
          {s.code} · {s.name}
        </option>
      ))}
    </Select>
  );
}

export function NewPriceDialog({ open, onClose, initialProductId }: { open: boolean; onClose: () => void; initialProductId?: string }) {
  const toast = useToast();
  const products = catalogService.listSync();
  const [productId, setProductId] = useState(initialProductId ?? '');
  const [storeId, setStoreId] = useState('lj001');
  const [price, setPrice] = useState('');
  const [start, setStart] = useState(toDateTimeLocal(new Date().toISOString()));
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const current = productId ? catalogService.effectivePrice(productId, storeId === 'all' ? undefined : storeId).price : 0;
  const newPrice = Number(price);
  const valid = !!productId && newPrice > 0 && Math.abs(newPrice - current) > 0.001;
  const variation = valid ? priceVariation(current, newPrice) : 0;
  const approval = valid && needsApproval(current, newPrice, storeId);

  const submit = (sendForApproval: boolean) => {
    if (!valid) return;
    pricesService.create(
      {
        productId,
        storeId,
        newPrice,
        startAt: new Date(start).toISOString(),
        endAt: end ? new Date(end).toISOString() : undefined,
        reason: reason || 'Alteração manual',
      },
      sendForApproval,
    );
    toast.success(sendForApproval ? (approval ? 'Enviado para aprovação' : 'Alteração aprovada') : 'Rascunho criado', products.find((p) => p.id === productId)?.shortName);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nova alteração de preço"
      description="Crie uma alteração individual para uma loja ou para toda a rede."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={() => submit(false)} disabled={!valid}>
            Salvar rascunho
          </Button>
          <Button onClick={() => submit(true)} disabled={!valid}>
            {approval ? 'Enviar para aprovação' : 'Salvar e aprovar'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Produto" className="sm:col-span-2">
          <ProductSelect value={productId} onChange={setProductId} products={products} />
        </Field>
        <Field label="Loja">
          <StoreSelect value={storeId} onChange={setStoreId} />
        </Field>
        <Field label="Preço atual">
          <Input value={productId ? formatCurrency(current) : '—'} disabled />
        </Field>
        <Field
          label="Novo preço (R$)"
          htmlFor="np"
          className="sm:col-span-2"
          hint={
            valid ? (
              <span className={cn(variation < 0 ? 'text-emerald-700' : 'text-red-700')}>
                Variação {variation > 0 ? '+' : ''}
                {formatPercent(variation)}
                {approval && ' · requer aprovação de gerente'}
              </span>
            ) : undefined
          }
        >
          <Input id="np" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
        </Field>
        <Field label="Início">
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Fim (opcional)">
          <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
        <Field label="Motivo" className="sm:col-span-2">
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: ajuste de competitividade, encarte regional…" />
        </Field>
      </div>
    </Dialog>
  );
}

export function BulkPriceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [storeId, setStoreId] = useState('all');
  const [mode, setMode] = useState<'pct' | 'valor'>('pct');
  const [amount, setAmount] = useState('-5');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const targets = useMemo(
    () => catalogService.listSync().filter((p) => p.status !== 'inativo' && (!brand || p.brand === brand) && (!category || p.category === category)),
    [brand, category],
  );
  const value = Number(amount);
  const compute = (p: Product) => {
    const current = catalogService.effectivePrice(p.id, storeId === 'all' ? undefined : storeId).price;
    const next = mode === 'pct' ? current * (1 + value / 100) : current + value;
    return { current, next: Math.max(0.01, Math.round(next * 100) / 100) };
  };
  const valid = (brand || category) && targets.length > 0 && value !== 0 && Number.isFinite(value);

  const submit = async () => {
    setLoading(true);
    const inputs: PriceChangeInput[] = targets.map((p) => ({ productId: p.id, storeId, newPrice: compute(p).next, reason: reason || 'Alteração em massa', source: 'massa' }));
    await pricesService.createMany(inputs, false);
    setLoading(false);
    toast.success(`${inputs.length} alterações criadas`, 'Revise e envie para aprovação na aba Rascunho.');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Alteração em massa"
      description="Aplique um reajuste a uma marca ou categoria inteira. As alterações serão criadas como rascunho."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!valid} loading={loading}>
            Criar {valid ? targets.length : ''} alterações
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Marca">
          <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Todas</option>
            {BRANDS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </Field>
        <Field label="Categoria">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Loja">
          <StoreSelect value={storeId} onChange={setStoreId} />
        </Field>
        <Field label="Tipo de ajuste">
          <SegmentedControl
            value={mode}
            onChange={setMode}
            items={[
              { value: 'pct', label: 'Percentual' },
              { value: 'valor', label: 'Valor (R$)' },
            ]}
          />
        </Field>
        <Field label={mode === 'pct' ? 'Ajuste (%)' : 'Ajuste (R$)'} hint="Use valores negativos para redução.">
          <Input type="number" step={mode === 'pct' ? '0.5' : '0.01'} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Motivo">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: reajuste de tabela" />
        </Field>
      </div>
      <div className="mt-4 rounded-md border border-slate-200">
        <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
          {brand || category ? `${targets.length} produtos afetados` : 'Selecione uma marca ou categoria para visualizar'}
        </div>
        {(brand || category) && (
          <ul className="max-h-[220px] divide-y divide-slate-100 overflow-y-auto text-sm">
            {targets.map((p) => {
              const { current, next } = compute(p);
              return (
                <li key={p.id} className="flex items-center justify-between px-3 py-2">
                  <span className="truncate text-slate-700">{p.shortName}</span>
                  <span className="shrink-0 tabular-nums">
                    <span className="text-slate-400">{formatCurrency(current)}</span> → <span className="font-medium text-slate-900">{formatCurrency(next)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Dialog>
  );
}

interface ImportRow {
  sku: string;
  price: number;
  storeCode: string;
  product?: Product;
  storeId?: string;
  error?: string;
}

const SAMPLE = `sku;preco;loja
REN-1208;5,29;LJ-001
REN-1221;5,29;LJ-001
GAL-1299;3,99;LJ-002
BAR-1364;17,90;TODAS
QUA-1494;0,89;LJ-006
VID-1637;109,90;LJ-012
ZAE-1013;4,79;LJ-001
XYZ-0001;3,00;LJ-001`;

function parseCsv(text: string): ImportRow[] {
  const products = catalogService.listSync();
  const stores = storesService.listSync();
  return text
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [sku = '', priceRaw = '', storeCode = ''] = line.split(/[;\t]/);
      const price = Number(priceRaw.replace(',', '.'));
      const product = products.find((p) => p.sku.toLowerCase() === sku.trim().toLowerCase());
      const code = storeCode.trim().toUpperCase();
      const store = stores.find((s) => s.code === code);
      const row: ImportRow = { sku: sku.trim(), price, storeCode: code, product, storeId: code === 'TODAS' ? 'all' : store?.id };
      if (!product) row.error = 'SKU não encontrado';
      else if (!row.storeId) row.error = 'Loja inválida';
      else if (!(price > 0)) row.error = 'Preço inválido';
      return row;
    });
}

export function ImportPriceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const validRows = rows.filter((r) => !r.error);

  const loadText = (text: string, name: string) => {
    setRows(parseCsv(text));
    setFileName(name);
  };

  const submit = async () => {
    setLoading(true);
    await pricesService.createMany(
      validRows.map((r) => ({ productId: r.product!.id, storeId: r.storeId!, newPrice: r.price, reason: `Importação ${fileName}`, source: 'importacao' })),
      false,
    );
    setLoading(false);
    toast.success(`${validRows.length} preços importados`, 'Criados como rascunho para revisão.');
    setRows([]);
    setFileName('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Importar preços"
      description="Envie um arquivo CSV com as colunas sku;preco;loja (código da loja ou TODAS)."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={validRows.length === 0} loading={loading}>
            Importar {validRows.length > 0 ? validRows.length : ''} linhas
          </Button>
        </>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) loadText(await f.text(), f.name);
          e.target.value = '';
        }}
      />
      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <FileUp className="h-6 w-6 text-slate-400" />
          <p className="mt-2 text-sm font-medium text-slate-900">Selecione um arquivo CSV</p>
          <p className="mt-1 text-xs text-slate-500">Até 5.000 linhas por arquivo · separador ponto e vírgula</p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload /> Escolher arquivo
            </Button>
            <Button variant="ghost" onClick={() => loadText(SAMPLE, 'exemplo-precos.csv')}>
              Usar arquivo de exemplo
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs">
            <span className="font-medium text-slate-700">{fileName}</span>
            <span className="text-slate-500">
              {validRows.length} válidas · {rows.length - validRows.length} com erro
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Produto</th>
                <th className="px-3 py-2 font-medium">Loja</th>
                <th className="px-3 py-2 text-right font-medium">Novo preço</th>
                <th className="px-3 py-2 font-medium">Validação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 font-mono text-[13px]">{r.sku}</td>
                  <td className="px-3 py-2">{r.product?.shortName ?? '—'}</td>
                  <td className="px-3 py-2">{r.storeCode}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.price > 0 ? formatCurrency(r.price) : '—'}</td>
                  <td className="px-3 py-2">{r.error ? <span className="text-xs text-red-600">{r.error}</span> : <span className="text-xs text-emerald-700">OK</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Dialog>
  );
}
