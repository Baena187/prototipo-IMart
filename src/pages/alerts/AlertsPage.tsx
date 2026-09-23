import { Bell, Check, CircleCheck, ExternalLink, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BulkBar } from '@/components/shared/BulkBar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterSelect, QuickFilters } from '@/components/shared/FilterBar';
import { KeyValueList } from '@/components/shared/KeyValue';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Select, Textarea } from '@/components/ui/form';
import { Avatar, Tabs } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useQuery } from '@/hooks/useQuery';
import { useScopedStore } from '@/hooks/useScopedStore';
import { ALERT_CATEGORY_LABEL, alertsService, db, storesService, usersService } from '@/services';
import { AlertCategory, AlertSeverity, AlertStatus, UserStatus, type Alert } from '@/types';
import { cn } from '@/utils/cn';
import { formatDateTime, formatRelative } from '@/utils/format';
import { ALERT_SEVERITY, ALERT_STATUS } from '@/utils/labels';

function AlertSheet({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  const toast = useToast();
  const { can } = useAuth();
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const users = usersService.listSync().filter((u) => u.status === UserStatus.Ativo);
  const manage = can('alerts.manage');
  const store = db.stores.get(alert.storeId);
  const assignee = alert.assigneeId ? db.users.get(alert.assigneeId) : undefined;

  return (
    <Sheet
      open
      onClose={onClose}
      title={alert.title}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <StatusBadge map={ALERT_SEVERITY} value={alert.severity} />
          <StatusBadge map={ALERT_STATUS} value={alert.status} dot={false} />
          <span>{formatRelative(alert.createdAt)}</span>
        </span>
      }
      footer={
        alert.status !== AlertStatus.Resolvido ? (
          <>
            {alert.status === AlertStatus.Aberto && (
              <Button
                variant="outline"
                disabled={!manage}
                onClick={async () => {
                  await alertsService.acknowledge([alert.id]);
                  toast.success('Alerta reconhecido', alert.title);
                }}
              >
                <Check /> Reconhecer
              </Button>
            )}
            <Button disabled={!manage} onClick={() => setConfirm(true)}>
              <CircleCheck /> Resolver
            </Button>
          </>
        ) : undefined
      }
    >
      <p className="text-sm text-slate-700">{alert.description}</p>
      <div className="mt-5">
        <KeyValueList
          items={[
            { label: 'Loja', value: <Link className="text-brand-700 hover:underline" to={`/lojas/${alert.storeId}`}>{store?.name}</Link> },
            { label: 'Categoria', value: ALERT_CATEGORY_LABEL[alert.category] },
            { label: 'Dispositivo', value: alert.deviceRef ? <span className="font-mono text-[13px]">{alert.deviceRef}</span> : '—' },
            { label: 'Criado em', value: formatDateTime(alert.createdAt) },
            { label: 'Reconhecido em', value: formatDateTime(alert.acknowledgedAt) },
            { label: 'Resolvido em', value: formatDateTime(alert.resolvedAt) },
          ]}
        />
      </div>
      {alert.link && (
        <Link to={alert.link} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
          Ir para o recurso <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <Field label="Responsável">
          <div className="flex items-center gap-2">
            {assignee && <Avatar name={assignee.name} size="sm" />}
            <div className="flex-1">
              <Select
                disabled={!manage || alert.status === AlertStatus.Resolvido}
                value={alert.assigneeId ?? ''}
                onChange={async (e) => {
                  if (!e.target.value) return;
                  await alertsService.assign(alert.id, e.target.value);
                  toast.success('Responsável atribuído', db.users.get(e.target.value)?.name);
                }}
              >
                <option value="">Sem responsável</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Field>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-3 text-sm font-medium text-slate-900">Observações</p>
        {alert.notes.length > 0 ? (
          <Timeline items={alert.notes.map((n) => ({ id: n.id, at: n.createdAt, title: n.author, description: n.text }))} />
        ) : (
          <p className="text-sm text-slate-500">Nenhuma observação registrada.</p>
        )}
        {manage && (
          <div className="mt-4 space-y-2">
            <Textarea rows={3} placeholder="Adicionar observação…" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                disabled={!note.trim()}
                onClick={async () => {
                  await alertsService.addNote(alert.id, note.trim());
                  setNote('');
                  toast.success('Observação adicionada');
                }}
              >
                Adicionar observação
              </Button>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Resolver alerta?"
        description="O alerta será encerrado e registrado na auditoria. Se a condição persistir, um novo alerta será gerado automaticamente."
        confirmLabel="Resolver alerta"
        onConfirm={async () => {
          setConfirm(false);
          await alertsService.resolve([alert.id]);
          toast.success('Alerta resolvido', alert.title);
        }}
      />
    </Sheet>
  );
}

type StatusTab = 'ativos' | AlertStatus | 'todos';

export default function AlertsPage() {
  const toast = useToast();
  const { can } = useAuth();
  const { data, loading } = useQuery(() => alertsService.list(), []);
  const stores = storesService.listSync();
  const [storeId, setStoreId] = useScopedStore();
  const [severity, setSeverity] = useState<AlertSeverity | 'todas'>('todas');
  const [category, setCategory] = useState<AlertCategory | ''>('');
  const [tab, setTab] = useState<StatusTab>('ativos');
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const base = useMemo(() => (data ?? []).filter((a) => (!storeId || a.storeId === storeId) && (!category || a.category === category)), [data, storeId, category]);
  const inTab = (a: Alert, t: StatusTab) => (t === 'todos' ? true : t === 'ativos' ? a.status !== AlertStatus.Resolvido : a.status === t);
  const tabbed = base.filter((a) => inTab(a, tab));
  const rows = tabbed.filter((a) => severity === 'todas' || a.severity === severity);
  const open = (data ?? []).find((a) => a.id === openId);

  const columns: Column<Alert>[] = [
    { key: 'sev', header: 'Severidade', cell: (a) => <StatusBadge map={ALERT_SEVERITY} value={a.severity} />, sortValue: (a) => ({ critico: 0, atencao: 1, informativo: 2 })[a.severity] },
    {
      key: 'title',
      header: 'Alerta',
      cell: (a) => (
        <div className="min-w-0 max-w-[420px]">
          <p className={cn('truncate text-slate-900', a.status === AlertStatus.Aberto && 'font-medium')}>{a.title}</p>
          <p className="truncate text-xs text-slate-500">{a.description}</p>
        </div>
      ),
    },
    { key: 'store', header: 'Loja', cell: (a) => db.stores.get(a.storeId)?.name, sortValue: (a) => a.storeId, hideBelow: 'md' },
    { key: 'cat', header: 'Categoria', cell: (a) => ALERT_CATEGORY_LABEL[a.category], sortValue: (a) => a.category, hideBelow: 'xl' },
    { key: 'at', header: 'Criado', cell: (a) => <span className="whitespace-nowrap text-slate-500">{formatRelative(a.createdAt)}</span>, sortValue: (a) => a.createdAt },
    {
      key: 'owner',
      header: 'Responsável',
      cell: (a) => {
        const u = a.assigneeId ? db.users.get(a.assigneeId) : undefined;
        return u ? (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Avatar name={u.name} size="sm" /> {u.name.split(' ')[0]}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        );
      },
      hideBelow: 'lg',
    },
    { key: 'status', header: 'Status', cell: (a) => <StatusBadge map={ALERT_STATUS} value={a.status} dot={false} />, sortValue: (a) => a.status },
  ];

  const sevCount = (s: AlertSeverity | 'todas') => tabbed.filter((a) => s === 'todas' || a.severity === s).length;

  return (
    <div>
      <PageHeader title="Alertas" description="Ocorrências de dispositivos, estoque, posicionamento e publicação em todas as lojas." />
      <div className="mb-3">
        <QuickFilters
          value={severity}
          onChange={setSeverity}
          items={[
            { value: 'todas', label: 'Todas as severidades', count: sevCount('todas') },
            { value: AlertSeverity.Critico, label: 'Crítico', count: sevCount(AlertSeverity.Critico) },
            { value: AlertSeverity.Atencao, label: 'Atenção', count: sevCount(AlertSeverity.Atencao) },
            { value: AlertSeverity.Informativo, label: 'Informativo', count: sevCount(AlertSeverity.Informativo) },
          ]}
        />
      </div>
      <Card>
        <Tabs
          className="px-2"
          value={tab}
          onChange={(t) => {
            setTab(t);
            setSelected([]);
          }}
          items={[
            { value: 'ativos', label: 'Em aberto', count: base.filter((a) => inTab(a, 'ativos')).length },
            { value: AlertStatus.Aberto, label: 'Não reconhecidos', count: base.filter((a) => a.status === AlertStatus.Aberto).length },
            { value: AlertStatus.Reconhecido, label: 'Reconhecidos', count: base.filter((a) => a.status === AlertStatus.Reconhecido).length },
            { value: AlertStatus.Resolvido, label: 'Resolvidos', count: base.filter((a) => a.status === AlertStatus.Resolvido).length },
            { value: 'todos', label: 'Todos', count: base.length },
          ]}
        />
        <FilterBar
          hasFilters={!!(storeId || category)}
          onClear={() => {
            setStoreId('');
            setCategory('');
          }}
        >
          <FilterSelect value={storeId} onChange={setStoreId} allLabel="Todas as lojas" options={stores.map((s) => ({ value: s.id, label: s.name }))} />
          <FilterSelect value={category} onChange={setCategory} allLabel="Todas as categorias" options={Object.values(AlertCategory).map((c) => ({ value: c, label: ALERT_CATEGORY_LABEL[c] }))} />
        </FilterBar>
        <BulkBar count={selected.length} onClear={() => setSelected([])}>
          <Button
            size="sm"
            variant="outline"
            disabled={!can('alerts.manage')}
            onClick={async () => {
              await alertsService.acknowledge(selected);
              toast.success(`${selected.length} alerta(s) reconhecido(s)`);
              setSelected([]);
            }}
          >
            <UserPlus /> Reconhecer
          </Button>
          <Button
            size="sm"
            disabled={!can('alerts.manage')}
            onClick={async () => {
              await alertsService.resolve(selected);
              toast.success(`${selected.length} alerta(s) resolvido(s)`);
              setSelected([]);
            }}
          >
            <CircleCheck /> Resolver
          </Button>
        </BulkBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(a) => a.id}
          selectable={can('alerts.manage')}
          selected={selected}
          onSelectedChange={setSelected}
          isRowSelectable={(a) => a.status !== AlertStatus.Resolvido}
          onRowClick={(a) => setOpenId(a.id)}
          defaultSort={{ key: 'sev', dir: 'asc' }}
          rowClassName={(a) => (a.severity === AlertSeverity.Critico && a.status === AlertStatus.Aberto ? 'shadow-[inset_3px_0_0_#dc2626]' : undefined)}
          empty={{ icon: <Bell />, title: 'Nenhum alerta', description: 'Não há alertas com os filtros selecionados.' }}
        />
      </Card>
      {open && <AlertSheet key={open.id} alert={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
