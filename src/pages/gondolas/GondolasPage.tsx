import { ArrowRight, Columns3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterSelect } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from '@/hooks/useQuery';
import { useScopedStore } from '@/hooks/useScopedStore';
import { gondolasService, storesService, type GondolaRow } from '@/services';
import { DeviceStatus } from '@/types';
import { formatRelative, normalize } from '@/utils/format';
import { DEVICE_STATUS } from '@/utils/labels';

export default function GondolasPage() {
  const navigate = useNavigate();
  const { data, loading } = useQuery(() => gondolasService.list(), []);
  const stores = storesService.listSync();
  const [storeId, setStoreId] = useScopedStore();
  const [search, setSearch] = useState('');
  const [aisle, setAisle] = useState('');
  const [status, setStatus] = useState<DeviceStatus | ''>('');

  const aisles = useMemo(() => Array.from(new Set((data ?? []).map((g) => g.gondola.aisle))).sort(), [data]);
  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (r) =>
          (!storeId || r.store.id === storeId) &&
          (!aisle || r.gondola.aisle === aisle) &&
          (!status || r.gondola.status === status) &&
          (!search || normalize(`${r.gondola.code} ${r.gondola.aisle} ${r.store.name} ${r.gondola.category}`).includes(normalize(search))),
      ),
    [data, storeId, aisle, status, search],
  );

  const columns: Column<GondolaRow>[] = [
    { key: 'id', header: 'ID', cell: (r) => <span className="font-medium text-slate-900">{r.gondola.code}</span>, sortValue: (r) => r.store.code + r.gondola.code },
    { key: 'store', header: 'Loja', cell: (r) => r.store.name, sortValue: (r) => r.store.name },
    { key: 'aisle', header: 'Corredor', cell: (r) => <span>{r.gondola.aisle} <span className="text-slate-400">· C{r.gondola.aisleNumber}</span></span>, sortValue: (r) => r.gondola.aisle, hideBelow: 'md' },
    { key: 'cat', header: 'Categoria', cell: (r) => r.gondola.category, sortValue: (r) => r.gondola.category, hideBelow: 'xl' },
    { key: 'shelvesN', header: 'Prateleiras', align: 'right', cell: (r) => r.gondola.shelfCount, sortValue: (r) => r.gondola.shelfCount, hideBelow: 'lg' },
    {
      key: 'shelves',
      header: 'Réguas',
      align: 'right',
      cell: (r) => (
        <span>
          {r.shelves}
          {r.shelvesOffline > 0 && <span className="ml-1 text-xs text-red-600">{r.shelvesOffline} off</span>}
        </span>
      ),
      sortValue: (r) => r.shelves,
    },
    { key: 'cams', header: 'Câmeras', align: 'right', cell: (r) => r.cameras, sortValue: (r) => r.cameras, hideBelow: 'sm' },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge map={DEVICE_STATUS} value={r.gondola.status} />, sortValue: (r) => r.gondola.status },
    { key: 'sync', header: 'Última sincronização', cell: (r) => <span className="text-slate-500">{formatRelative(r.gondola.lastSyncAt)}</span>, sortValue: (r) => r.gondola.lastSyncAt, hideBelow: 'lg' },
    { key: 'go', header: <span className="sr-only">Abrir</span>, align: 'right', cell: () => <ArrowRight className="ml-auto h-4 w-4 text-slate-300" /> },
  ];

  return (
    <div>
      <PageHeader title="Gôndolas" description="Gôndolas inteligentes com réguas digitais contínuas e câmeras de monitoramento." />
      <Card>
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Buscar gôndola, corredor ou categoria"
          hasFilters={!!(storeId || aisle || status || search)}
          onClear={() => {
            setStoreId('');
            setAisle('');
            setStatus('');
            setSearch('');
          }}
        >
          <FilterSelect value={storeId} onChange={setStoreId} allLabel="Todas as lojas" options={stores.map((s) => ({ value: s.id, label: s.name }))} />
          <FilterSelect value={aisle} onChange={setAisle} allLabel="Todos os corredores" options={aisles.map((a) => ({ value: a, label: a }))} />
          <FilterSelect value={status} onChange={setStatus} allLabel="Todos os status" options={Object.values(DeviceStatus).map((s) => ({ value: s, label: DEVICE_STATUS[s].label }))} />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(r) => r.gondola.id}
          onRowClick={(r) => navigate(`/gondolas/${r.gondola.id}`)}
          defaultSort={{ key: 'id', dir: 'asc' }}
          pageSize={25}
          empty={{ icon: <Columns3 />, title: 'Nenhuma gôndola encontrada' }}
        />
      </Card>
      <p className="mt-3 text-xs text-slate-500">
        Dica: clique em uma gôndola para ver a representação visual das prateleiras.{' '}
        <Button variant="link" size="sm" className="text-xs" onClick={() => navigate('/gondolas/lj001-g07')}>
          Abrir gôndola G-07 · Goiânia Centro
        </Button>
      </p>
    </div>
  );
}
