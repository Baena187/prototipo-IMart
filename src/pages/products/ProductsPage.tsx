import { Download, LayoutGrid, List, Package, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterSelect, QuickFilters } from '@/components/shared/FilterBar';
import { KeyValueList } from '@/components/shared/KeyValue';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProductThumb } from '@/components/shared/ProductThumb';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/form';
import { SegmentedControl, Skeleton } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { BRANDS, CATEGORIES } from '@/data/products';
import { useQuery } from '@/hooks/useQuery';
import { catalogService, db } from '@/services';
import { ProductStatus, type Product } from '@/types';
import { formatCurrency, formatDateTime, normalize } from '@/utils/format';
import { PRICE_STATUS, PRODUCT_STATUS } from '@/utils/labels';

function ProductDrawer({ product, onClose }: { product: Product; onClose: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const [promo, setPromo] = useState(product.promoPrice?.toFixed(2) ?? '');
  const [saving, setSaving] = useState(false);
  const shelves = db.shelves.all().filter((s) => s.published.slots.some((sl) => sl.productId === product.id));
  const stores = new Set(shelves.map((s) => s.storeId)).size;
  const history = db.prices.all().filter((p) => p.productId === product.id).slice(0, 6);

  return (
    <Sheet
      open
      onClose={onClose}
      title={product.shortName}
      description={product.description}
      footer={
        <>
          <Button variant="outline" onClick={() => navigate(`/precos?novo=${product.id}`)} disabled={!can('prices.edit')}>
            <Tag /> Alterar preço
          </Button>
          <Button
            loading={saving}
            disabled={!can('products.manage') && !can('prices.edit')}
            onClick={async () => {
              setSaving(true);
              await catalogService.update(product.id, { promoPrice: promo ? Number(promo) : undefined });
              setSaving(false);
              toast.success('Produto atualizado', `Preço promocional de ${product.shortName} salvo.`);
            }}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-4">
        <ProductThumb brand={product.brand} color={product.color} size="lg" />
        <div>
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge map={PRODUCT_STATUS} value={product.status} />
            <Badge tone="outline">{product.brand}</Badge>
            {product.line && <Badge tone="outline">{product.line}</Badge>}
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{formatCurrency(product.price)}</p>
          <p className="text-xs text-slate-500">Preço base da rede · anterior {formatCurrency(product.previousPrice)}</p>
        </div>
      </div>
      <div className="mt-6">
        <KeyValueList
          items={[
            { label: 'Código', value: product.code },
            { label: 'SKU', value: <span className="font-mono text-[13px]">{product.sku}</span> },
            { label: 'EAN', value: <span className="font-mono text-[13px]">{product.ean}</span> },
            { label: 'Categoria', value: product.category },
            { label: 'Embalagem', value: product.unit },
            { label: 'Exposição', value: `${shelves.length} réguas em ${stores} lojas` },
          ]}
        />
      </div>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <Field label="Preço promocional" htmlFor="promo" hint="Usado quando a régua ou uma campanha ativa o modo promoção.">
          <Input id="promo" type="number" step="0.01" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Sem preço promocional" />
        </Field>
      </div>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-3 text-sm font-medium text-slate-900">Histórico de alterações de preço</p>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma alteração registrada.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-2 text-sm">
                <div>
                  <p className="tabular-nums text-slate-900">
                    {formatCurrency(h.currentPrice)} → <strong>{formatCurrency(h.newPrice)}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    {h.storeId === 'all' ? 'Todas as lojas' : db.stores.get(h.storeId)?.name} · {formatDateTime(h.createdAt)}
                  </p>
                </div>
                <StatusBadge map={PRICE_STATUS} value={h.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}

export default function ProductsPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data, loading } = useQuery(() => catalogService.list(), []);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState<string>('todas');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [view, setView] = useState<'lista' | 'grade'>('lista');
  const openId = params.get('produto');
  const open = data?.find((p) => p.id === openId);

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (p) =>
          (brand === 'todas' || p.brand === brand) &&
          (!category || p.category === category) &&
          (!status || p.status === status) &&
          (!search || normalize(`${p.shortName} ${p.description} ${p.sku} ${p.ean} ${p.code}`).includes(normalize(search))),
      ),
    [data, brand, category, status, search],
  );

  const setOpen = (id?: string) => {
    const next = new URLSearchParams(params);
    if (id) next.set('produto', id);
    else next.delete('produto');
    setParams(next, { replace: true });
  };

  const columns: Column<Product>[] = [
    {
      key: 'desc',
      header: 'Produto',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <ProductThumb brand={p.brand} color={p.color} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{p.shortName}</p>
            <p className="truncate text-xs text-slate-500">{p.description}</p>
          </div>
        </div>
      ),
      sortValue: (p) => p.shortName,
    },
    { key: 'code', header: 'Código', cell: (p) => <span className="text-slate-500">{p.code}</span>, sortValue: (p) => p.code, hideBelow: 'xl' },
    { key: 'sku', header: 'SKU', cell: (p) => <span className="font-mono text-[13px]">{p.sku}</span>, sortValue: (p) => p.sku, hideBelow: 'md' },
    { key: 'ean', header: 'EAN', cell: (p) => <span className="font-mono text-[13px] text-slate-500">{p.ean}</span>, hideBelow: 'xl' },
    { key: 'brand', header: 'Marca', cell: (p) => p.brand, sortValue: (p) => p.brand, hideBelow: 'sm' },
    { key: 'cat', header: 'Categoria', cell: (p) => p.category, sortValue: (p) => p.category, hideBelow: 'lg' },
    { key: 'price', header: 'Preço', align: 'right', cell: (p) => <span className="font-medium text-slate-900">{formatCurrency(p.price)}</span>, sortValue: (p) => p.price },
    { key: 'promo', header: 'Promocional', align: 'right', cell: (p) => (p.promoPrice ? <span className="text-red-700">{formatCurrency(p.promoPrice)}</span> : <span className="text-slate-300">—</span>), sortValue: (p) => p.promoPrice ?? 0, hideBelow: 'md' },
    { key: 'status', header: 'Status', cell: (p) => <StatusBadge map={PRODUCT_STATUS} value={p.status} />, sortValue: (p) => p.status, hideBelow: 'sm' },
  ];

  const brandCounts = (b: string) => (data ?? []).filter((p) => p.brand === b).length;

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Catálogo de produtos exibidos nas réguas digitais. Integração com ERP prevista para a próxima etapa."
        actions={
          <Button variant="outline" onClick={() => toast.success('Exportação iniciada', 'catalogo-produtos.csv será enviado para o seu e-mail.')}>
            <Download /> Exportar
          </Button>
        }
      />
      <div className="mb-3">
        <QuickFilters
          value={brand}
          onChange={setBrand}
          items={[{ value: 'todas', label: 'Todas as marcas', count: data?.length }, ...BRANDS.map((b) => ({ value: b, label: b, count: brandCounts(b) }))]}
        />
      </div>
      <Card>
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Buscar por descrição, SKU ou EAN"
          hasFilters={!!(search || category || status || brand !== 'todas')}
          onClear={() => {
            setSearch('');
            setCategory('');
            setStatus('');
            setBrand('todas');
          }}
          actions={
            <SegmentedControl
              size="sm"
              value={view}
              onChange={setView}
              items={[
                { value: 'lista', label: <List />, title: 'Lista' },
                { value: 'grade', label: <LayoutGrid />, title: 'Grade' },
              ]}
            />
          }
        >
          <FilterSelect value={category} onChange={setCategory} allLabel="Todas as categorias" options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <FilterSelect value={status} onChange={setStatus} allLabel="Todos os status" options={Object.values(ProductStatus).map((s) => ({ value: s, label: PRODUCT_STATUS[s].label }))} />
        </FilterBar>
        {view === 'lista' ? (
          <DataTable columns={columns} rows={rows} loading={loading} rowKey={(p) => p.id} onRowClick={(p) => setOpen(p.id)} pageSize={20} empty={{ icon: <Package />, title: 'Nenhum produto encontrado' }} />
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {loading && Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            {rows.map((p) => (
              <button key={p.id} onClick={() => setOpen(p.id)} className="rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50">
                <ProductThumb brand={p.brand} color={p.color} size="lg" className="mx-auto h-28 w-full" />
                <p className="mt-3 truncate text-sm font-medium text-slate-900">{p.shortName}</p>
                <p className="truncate text-xs text-slate-500">
                  {p.sku} · {p.unit}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(p.price)}</span>
                  {p.promoPrice && <span className="text-xs tabular-nums text-red-700">{formatCurrency(p.promoPrice)}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
      {open && <ProductDrawer key={open.id} product={open} onClose={() => setOpen()} />}
    </div>
  );
}
