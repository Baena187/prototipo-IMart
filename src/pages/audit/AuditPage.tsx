import { ArrowRight, Download, ScrollText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterSelect } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/misc';
import { useToast } from '@/contexts/ToastContext';
import { useQuery } from '@/hooks/useQuery';
import { useScopedStore } from '@/hooks/useScopedStore';
import { auditService, db, storesService } from '@/services';
import { AuditAction, type AuditEvent } from '@/types';
import { formatDate, formatTime, normalize } from '@/utils/format';
import { AUDIT_ACTION } from '@/utils/labels';

type Period = 'hoje' | '7d' | '30d' | '';

export default function AuditPage() {
  const toast = useToast();
  const { data, loading } = useQuery(() => auditService.list(), []);
  const stores = storesService.listSync();
  const [storeId, setStoreId] = useScopedStore();
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<AuditAction | ''>('');
  const [user, setUser] = useState('');
  const [period, setPeriod] = useState<Period>('');

  const users = useMemo(() => Array.from(new Set((data ?? []).map((e) => e.userName))).sort(), [data]);
  const rows = useMemo(() => {
    const now = Date.now();
    const limit = period === 'hoje' ? new Date().setHours(0, 0, 0, 0) : period === '7d' ? now - 7 * 864e5 : period === '30d' ? now - 30 * 864e5 : 0;
    return (data ?? [])
      .filter(
        (e) =>
          (!storeId || e.storeId === storeId) &&
          (!action || e.action === action) &&
          (!user || e.userName === user) &&
          (!limit || new Date(e.at).getTime() >= limit) &&
          (!search || normalize(`${e.summary} ${e.deviceRef ?? ''} ${e.previousValue ?? ''} ${e.newValue ?? ''}`).includes(normalize(search))),
      )
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [data, storeId, action, user, period, search]);

  const columns: Column<AuditEvent>[] = [
    {
      key: 'at',
      header: 'Data/hora',
      cell: (e) => (
        <div className="whitespace-nowrap tabular-nums">
          <p className="text-slate-900">{formatDate(e.at)}</p>
          <p className="text-xs text-slate-500">{formatTime(e.at)}</p>
        </div>
      ),
      sortValue: (e) => e.at,
    },
    {
      key: 'user',
      header: 'Usuário',
      cell: (e) => (
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <Avatar name={e.userName} size="sm" /> {e.userName}
        </span>
      ),
      sortValue: (e) => e.userName,
      hideBelow: 'md',
    },
    {
      key: 'action',
      header: 'Ação',
      cell: (e) => (
        <div className="min-w-[240px] max-w-[440px]">
          <StatusBadge map={AUDIT_ACTION} value={e.action} dot={false} className="text-[11px]" />
          <p className="mt-1 text-slate-900">{e.summary}</p>
        </div>
      ),
      sortValue: (e) => e.action,
    },
    {
      key: 'values',
      header: 'Valor anterior → novo',
      cell: (e) =>
        e.previousValue || e.newValue ? (
          <span className="inline-flex flex-wrap items-center gap-1.5 text-[13px]">
            <span className="text-slate-500">{e.previousValue ?? '—'}</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-medium text-slate-900">{e.newValue ?? '—'}</span>
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
      hideBelow: 'sm',
    },
    { key: 'store', header: 'Loja', cell: (e) => (e.storeId ? db.stores.get(e.storeId)?.name : <span className="text-slate-400">Rede</span>), sortValue: (e) => e.storeId ?? '', hideBelow: 'lg' },
    { key: 'device', header: 'Dispositivo', cell: (e) => (e.deviceRef ? <span className="font-mono text-[13px]">{e.deviceRef}</span> : <span className="text-slate-300">—</span>), hideBelow: 'xl' },
    { key: 'origin', header: 'IP / origem', cell: (e) => <span className="whitespace-nowrap text-[13px] text-slate-500">{e.origin}</span>, hideBelow: 'xl' },
  ];

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description="Registro imutável de todas as ações realizadas na plataforma, por usuários e pelo sistema."
        actions={
          <Button variant="outline" onClick={() => toast.success('Exportação iniciada', `${rows.length} eventos · auditoria.csv`)}>
            <Download /> Exportar
          </Button>
        }
      />
      <Card>
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Buscar ação, dispositivo ou valor"
          hasFilters={!!(search || storeId || action || user || period)}
          onClear={() => {
            setSearch('');
            setStoreId('');
            setAction('');
            setUser('');
            setPeriod('');
          }}
        >
          <FilterSelect value={period} onChange={setPeriod} allLabel="Todo o período" options={[{ value: 'hoje', label: 'Hoje' }, { value: '7d', label: 'Últimos 7 dias' }, { value: '30d', label: 'Últimos 30 dias' }]} />
          <FilterSelect value={action} onChange={setAction} allLabel="Todas as ações" options={Object.values(AuditAction).map((a) => ({ value: a, label: AUDIT_ACTION[a].label }))} />
          <FilterSelect value={user} onChange={setUser} allLabel="Todos os usuários" options={users.map((u) => ({ value: u, label: u }))} />
          <FilterSelect value={storeId} onChange={setStoreId} allLabel="Todas as lojas" options={stores.map((s) => ({ value: s.id, label: s.name }))} />
        </FilterBar>
        <DataTable columns={columns} rows={rows} loading={loading} rowKey={(e) => e.id} pageSize={20} empty={{ icon: <ScrollText />, title: 'Nenhum evento encontrado' }} />
      </Card>
    </div>
  );
}
