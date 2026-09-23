import { ArrowRight, Download, Store } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterSelect } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/contexts/ToastContext';
import { useQuery } from '@/hooks/useQuery';
import { storesService, type StoreSummary } from '@/services';
import { StoreStatus } from '@/types';
import { formatInt, formatRelative, normalize } from '@/utils/format';
import { STORE_STATUS } from '@/utils/labels';

export default function StoresPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading } = useQuery(() => storesService.list(), []);
  const [search, setSearch] = useState('');
  const [uf, setUf] = useState('');
  const [status, setStatus] = useState<StoreStatus | ''>('');

  const ufs = useMemo(() => Array.from(new Set((data ?? []).map((s) => s.store.uf))).sort(), [data]);
  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (s) =>
          (!search || normalize(`${s.store.name} ${s.store.code} ${s.store.city}`).includes(normalize(search))) &&
          (!uf || s.store.uf === uf) &&
          (!status || s.store.status === status),
      ),
    [data, search, uf, status],
  );

  const columns: Column<StoreSummary>[] = [
    { key: 'code', header: 'Código', cell: (r) => <span className="font-mono text-[13px] text-slate-500">{r.store.code}</span>, sortValue: (r) => r.store.code },
    {
      key: 'name',
      header: 'Loja',
      cell: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.store.name}</p>
          <p className="text-xs text-slate-500">Gerente: {r.store.manager}</p>
        </div>
      ),
      sortValue: (r) => r.store.name,
    },
    { key: 'city', header: 'Cidade', cell: (r) => r.store.city, sortValue: (r) => r.store.city, hideBelow: 'md' },
    { key: 'uf', header: 'UF', cell: (r) => r.store.uf, sortValue: (r) => r.store.uf, hideBelow: 'md' },
    { key: 'gondolas', header: 'Gôndolas', align: 'right', cell: (r) => formatInt(r.gondolas), sortValue: (r) => r.gondolas },
    {
      key: 'shelves',
      header: 'Réguas',
      align: 'right',
      cell: (r) => (
        <span>
          {formatInt(r.shelves)}
          {r.shelves - r.shelvesOnline > 0 && r.store.status !== StoreStatus.Implantacao && <span className="ml-1 text-xs text-red-600">({r.shelves - r.shelvesOnline} ⚠)</span>}
        </span>
      ),
      sortValue: (r) => r.shelves,
      hideBelow: 'sm',
    },
    { key: 'cameras', header: 'Câmeras', align: 'right', cell: (r) => formatInt(r.cameras), sortValue: (r) => r.cameras, hideBelow: 'lg' },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge map={STORE_STATUS} value={r.store.status} />, sortValue: (r) => r.store.status },
    { key: 'seen', header: 'Última comunicação', cell: (r) => <span className="text-slate-500">{formatRelative(r.store.lastSeenAt)}</span>, sortValue: (r) => r.store.lastSeenAt, hideBelow: 'lg' },
    {
      key: 'actions',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      cell: (r) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/lojas/${r.store.id}`)}>
          Abrir <ArrowRight />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Lojas"
        description="Lojas da rede com réguas digitais e câmeras iMart instaladas."
        actions={
          <Button variant="outline" onClick={() => toast.success('Exportação iniciada', 'O arquivo lojas.csv será enviado para o seu e-mail.')}>
            <Download /> Exportar
          </Button>
        }
      />
      <Card>
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Buscar por loja, código ou cidade"
          hasFilters={!!(search || uf || status)}
          onClear={() => {
            setSearch('');
            setUf('');
            setStatus('');
          }}
        >
          <FilterSelect value={uf} onChange={setUf} allLabel="Todas as UFs" options={ufs.map((u) => ({ value: u, label: u }))} />
          <FilterSelect value={status} onChange={setStatus} allLabel="Todos os status" options={Object.values(StoreStatus).map((s) => ({ value: s, label: STORE_STATUS[s].label }))} />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(r) => r.store.id}
          onRowClick={(r) => navigate(`/lojas/${r.store.id}`)}
          defaultSort={{ key: 'code', dir: 'asc' }}
          empty={{ icon: <Store />, title: 'Nenhuma loja encontrada' }}
        />
      </Card>
    </div>
  );
}
