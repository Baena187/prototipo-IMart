import { Pencil, Rows3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterSelect, QuickFilters } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ShelfStrip } from '@/components/shelf/ShelfStrip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePriceBook } from '@/hooks/usePriceBook';
import { useQuery } from '@/hooks/useQuery';
import { useScopedStore } from '@/hooks/useScopedStore';
import { shelvesService, storesService, type ShelfRow } from '@/services';
import { ContentStatus, DeviceStatus } from '@/types';
import { formatRelative, normalize } from '@/utils/format';
import { CONTENT_STATUS, DEVICE_STATUS } from '@/utils/labels';
import { isAligned } from '@/utils/shelf';

type Quick = 'todas' | 'problemas' | 'rascunhos' | 'desalinhadas';

export default function ShelvesPage() {
  const navigate = useNavigate();
  const { data, loading } = useQuery(() => shelvesService.list(), []);
  const stores = storesService.listSync();
  const [storeId, setStoreId] = useScopedStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<DeviceStatus | ''>('');
  const [quick, setQuick] = useState<Quick>('todas');
  const book = usePriceBook(storeId || undefined);

  const base = useMemo(() => (data ?? []).filter((r) => !storeId || r.store.id === storeId), [data, storeId]);
  const misalignedOf = (r: ShelfRow) => r.shelf.published.slots.filter((s) => !isAligned(s, r.shelf.facings)).length;
  const counts = useMemo(
    () => ({
      todas: base.length,
      problemas: base.filter((r) => r.shelf.status === DeviceStatus.Offline || r.shelf.status === DeviceStatus.Atencao).length,
      rascunhos: base.filter((r) => r.shelf.contentStatus !== ContentStatus.Publicado).length,
      desalinhadas: base.filter((r) => misalignedOf(r) > 0).length,
    }),
    [base],
  );

  const rows = useMemo(
    () =>
      base.filter((r) => {
        if (status && r.shelf.status !== status) return false;
        if (search && !normalize(`${r.shelf.code} ${r.store.name} ${r.gondola.aisle}`).includes(normalize(search))) return false;
        if (quick === 'problemas') return r.shelf.status === DeviceStatus.Offline || r.shelf.status === DeviceStatus.Atencao;
        if (quick === 'rascunhos') return r.shelf.contentStatus !== ContentStatus.Publicado;
        if (quick === 'desalinhadas') return misalignedOf(r) > 0;
        return true;
      }),
    [base, status, search, quick],
  );

  const columns: Column<ShelfRow>[] = [
    {
      key: 'code',
      header: 'Régua',
      cell: (r) => (
        <div>
          <p className="font-mono text-[13px] font-semibold text-slate-900">{r.shelf.code}</p>
          <p className="text-xs text-slate-500">{r.store.name}</p>
        </div>
      ),
      sortValue: (r) => r.store.code + r.shelf.code,
    },
    { key: 'aisle', header: 'Corredor', cell: (r) => r.gondola.aisle, sortValue: (r) => r.gondola.aisle, hideBelow: 'lg' },
    {
      key: 'preview',
      header: 'Conteúdo exibido',
      className: 'min-w-[260px] w-[38%]',
      cell: (r) => <ShelfStrip widthMm={r.shelf.widthMm} slots={r.shelf.published.slots} products={book.products} prices={book.prices} size="xs" offline={r.shelf.status === DeviceStatus.Offline} />,
      hideBelow: 'md',
    },
    { key: 'status', header: 'Dispositivo', cell: (r) => <StatusBadge map={DEVICE_STATUS} value={r.shelf.status} />, sortValue: (r) => r.shelf.status },
    {
      key: 'content',
      header: 'Conteúdo',
      cell: (r) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge map={CONTENT_STATUS} value={r.shelf.contentStatus} dot={false} />
          {misalignedOf(r) > 0 && <span className="text-[11px] font-medium text-amber-700">{misalignedOf(r)} desalinhado(s)</span>}
        </div>
      ),
      sortValue: (r) => r.shelf.contentStatus,
      hideBelow: 'sm',
    },
    { key: 'pub', header: 'Última publicação', cell: (r) => <span className="text-slate-500">{formatRelative(r.shelf.lastPublishAt)}</span>, sortValue: (r) => r.shelf.lastPublishAt, hideBelow: 'xl' },
    {
      key: 'edit',
      header: <span className="sr-only">Editar</span>,
      align: 'right',
      cell: (r) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/reguas/${r.shelf.id}/editor`)}>
          <Pencil /> Editar
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Réguas digitais"
        description="Réguas de LED contínuas instaladas nas prateleiras. Ajuste conteúdo, posição e preços de cada régua."
        actions={
          <Button onClick={() => navigate('/reguas/lj001-g07-p03/editor')}>
            <Pencil /> Abrir régua G07-P03
          </Button>
        }
      />
      <div className="mb-3">
        <QuickFilters
          value={quick}
          onChange={setQuick}
          items={[
            { value: 'todas', label: 'Todas', count: counts.todas },
            { value: 'problemas', label: 'Com problema', count: counts.problemas },
            { value: 'rascunhos', label: 'Rascunhos e agendadas', count: counts.rascunhos },
            { value: 'desalinhadas', label: 'Preço desalinhado', count: counts.desalinhadas },
          ]}
        />
      </div>
      <Card>
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Buscar régua (ex.: G07-P03)"
          hasFilters={!!(storeId || status || search)}
          onClear={() => {
            setStoreId('');
            setStatus('');
            setSearch('');
          }}
        >
          <FilterSelect value={storeId} onChange={setStoreId} allLabel="Todas as lojas" options={stores.map((s) => ({ value: s.id, label: s.name }))} />
          <FilterSelect value={status} onChange={setStatus} allLabel="Todos os status" options={Object.values(DeviceStatus).map((s) => ({ value: s, label: DEVICE_STATUS[s].label }))} />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading || !book.ready}
          rowKey={(r) => r.shelf.id}
          onRowClick={(r) => navigate(`/reguas/${r.shelf.id}/editor`)}
          defaultSort={{ key: 'code', dir: 'asc' }}
          pageSize={15}
          empty={{ icon: <Rows3 />, title: 'Nenhuma régua encontrada' }}
        />
      </Card>
    </div>
  );
}
