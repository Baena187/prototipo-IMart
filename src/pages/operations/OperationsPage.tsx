import { CalendarDays, ClipboardList, LayoutGrid, List, Plus, ShieldCheck, Siren, Truck, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterSelect } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Avatar, SegmentedControl, Tabs } from '@/components/ui/misc';
import { Dialog } from '@/components/ui/overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useQuery } from '@/hooks/useQuery';
import { useScopedStore } from '@/hooks/useScopedStore';
import { db, SLA_BY_PRIORITY, storesService, TICKET_STATUS_FLOW, ticketsService, type TicketInput } from '@/services';
import { TicketKind, TicketPriority, TicketStatus, UserRole, type Ticket } from '@/types';
import { cn } from '@/utils/cn';
import { formatDateTime, formatRelative, normalize } from '@/utils/format';
import { TICKET_KIND, TICKET_PRIORITY, TICKET_STATUS } from '@/utils/labels';
import { SlaIndicator } from './TicketSheet';
import { TicketSheet } from './TicketSheet';

type Tab = 'chamados' | 'visitas' | 'preventivas' | 'substituicoes';

function NewTicketDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (t: Ticket) => void }) {
  const toast = useToast();
  const [form, setForm] = useState<TicketInput>({
    kind: TicketKind.Corretivo,
    storeId: 'lj001',
    equipment: '',
    problem: '',
    description: '',
    priority: TicketPriority.Media,
  });
  const [loading, setLoading] = useState(false);
  const techs = db.users.all().filter((u) => u.role === UserRole.Tecnico);
  const valid = form.equipment.trim() && form.problem.trim();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Novo chamado"
      description="Registre um atendimento técnico para uma loja."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!valid}
            loading={loading}
            onClick={async () => {
              setLoading(true);
              const t = await ticketsService.create(form);
              setLoading(false);
              toast.success(`Chamado ${t.number} aberto`, `SLA de ${t.slaHours}h`);
              onCreated(t);
            }}
          >
            Abrir chamado
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as TicketKind })}>
            {Object.values(TicketKind).map((k) => (
              <option key={k} value={k}>
                {TICKET_KIND[k].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Loja">
          <Select value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
            {storesService.listSync().map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Equipamento" className="sm:col-span-2">
          <Input value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} placeholder="Ex.: Régua LED G07-P03" />
        </Field>
        <Field label="Problema" className="sm:col-span-2">
          <Input value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="Ex.: Régua sem comunicação" />
        </Field>
        <Field label="Descrição" className="sm:col-span-2">
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Prioridade" hint={`SLA de ${SLA_BY_PRIORITY[form.priority]}h`}>
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}>
            {Object.values(TicketPriority).map((p) => (
              <option key={p} value={p}>
                {TICKET_PRIORITY[p].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Técnico">
          <Select value={form.technicianId ?? ''} onChange={(e) => setForm({ ...form, technicianId: e.target.value || undefined })}>
            <option value="">Definir depois</option>
            {techs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Dialog>
  );
}

export default function OperationsPage() {
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data, loading } = useQuery(() => ticketsService.list(), []);
  const stores = storesService.listSync();
  const [storeId, setStoreId] = useScopedStore();
  const [tab, setTab] = useState<Tab>('chamados');
  const [view, setView] = useState<'lista' | 'quadro'>('lista');
  const [priority, setPriority] = useState<TicketPriority | ''>('');
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const openId = params.get('chamado');
  const open = (data ?? []).find((t) => t.id === openId);

  const setOpen = (id?: string) => {
    const next = new URLSearchParams(params);
    if (id) next.set('chamado', id);
    else next.delete('chamado');
    setParams(next, { replace: true });
  };

  const all = data ?? [];
  const active = all.filter((t) => t.status !== TicketStatus.Resolvido);
  const base = useMemo(
    () =>
      (data ?? []).filter(
        (t) =>
          (!storeId || t.storeId === storeId) &&
          (!priority || t.priority === priority) &&
          (!search || normalize(`${t.number} ${t.problem} ${t.equipment}`).includes(normalize(search))),
      ),
    [data, storeId, priority, search],
  );
  const byTab: Record<Tab, Ticket[]> = {
    chamados: base.filter((t) => t.kind === TicketKind.Corretivo || t.kind === TicketKind.Incidente),
    visitas: base.filter((t) => t.status === TicketStatus.VisitaAgendada).sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '')),
    preventivas: base.filter((t) => t.kind === TicketKind.Preventiva),
    substituicoes: base.filter((t) => t.kind === TicketKind.Substituicao),
  };
  const rows = byTab[tab];

  const columns: Column<Ticket>[] = [
    {
      key: 'num',
      header: 'Chamado',
      cell: (t) => (
        <div className="min-w-0">
          <p className="font-mono text-[13px] font-semibold text-slate-900">#{t.number}</p>
          <p className="truncate text-sm text-slate-700">{t.problem}</p>
        </div>
      ),
      sortValue: (t) => t.number,
    },
    { key: 'store', header: 'Loja', cell: (t) => <div><p>{db.stores.get(t.storeId)?.name}</p><p className="max-w-[200px] truncate text-xs text-slate-500">{t.equipment}</p></div>, sortValue: (t) => t.storeId, hideBelow: 'md' },
    { key: 'prio', header: 'Prioridade', cell: (t) => <StatusBadge map={TICKET_PRIORITY} value={t.priority} dot={false} />, sortValue: (t) => ({ critica: 0, alta: 1, media: 2, baixa: 3 })[t.priority] },
    { key: 'sla', header: 'SLA', cell: (t) => <SlaIndicator ticket={t} compact />, sortValue: (t) => t.dueAt, hideBelow: 'sm' },
    {
      key: 'tech',
      header: 'Técnico',
      cell: (t) => {
        const u = t.technicianId ? db.users.get(t.technicianId) : undefined;
        return u ? (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Avatar name={u.name} size="sm" /> {u.name}
          </span>
        ) : (
          <span className="text-slate-400">Não atribuído</span>
        );
      },
      hideBelow: 'lg',
    },
    ...(tab === 'visitas'
      ? [{ key: 'visit', header: 'Visita', cell: (t: Ticket) => <span className="whitespace-nowrap">{formatDateTime(t.scheduledAt)}</span>, sortValue: (t: Ticket) => t.scheduledAt ?? '' }]
      : [{ key: 'opened', header: 'Aberto', cell: (t: Ticket) => <span className="whitespace-nowrap text-slate-500">{formatRelative(t.openedAt)}</span>, sortValue: (t: Ticket) => t.openedAt, hideBelow: 'xl' as const }]),
    { key: 'status', header: 'Status', cell: (t) => <StatusBadge map={TICKET_STATUS} value={t.status} />, sortValue: (t) => TICKET_STATUS_FLOW.indexOf(t.status) },
  ];

  return (
    <div>
      <PageHeader
        title="Central de operações"
        description="Operação do serviço iMart: chamados, visitas técnicas, incidentes e manutenção dos equipamentos."
        actions={
          <Button onClick={() => setNewOpen(true)} disabled={!can('operations.manage')}>
            <Plus /> Novo chamado
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Chamados abertos" icon={<ClipboardList />} loading={loading} value={active.filter((t) => t.kind === TicketKind.Corretivo || t.kind === TicketKind.Incidente).length} />
        <StatCard label="Visitas técnicas programadas" icon={<CalendarDays />} loading={loading} value={active.filter((t) => t.status === TicketStatus.VisitaAgendada).length} />
        <StatCard label="Incidentes" icon={<Siren />} loading={loading} value={active.filter((t) => t.kind === TicketKind.Incidente).length} tone="danger" />
        <StatCard label="Manutenções preventivas" icon={<ShieldCheck />} loading={loading} value={active.filter((t) => t.kind === TicketKind.Preventiva).length} />
        <StatCard label="Aguardando substituição" icon={<Truck />} loading={loading} value={active.filter((t) => t.kind === TicketKind.Substituicao).length} hint="equipamentos" />
      </div>

      <Card className="mt-4">
        <Tabs
          className="px-2"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'chamados', label: 'Chamados e incidentes', count: byTab.chamados.filter((t) => t.status !== TicketStatus.Resolvido).length },
            { value: 'visitas', label: 'Visitas técnicas', count: byTab.visitas.length },
            { value: 'preventivas', label: 'Manutenções preventivas', count: byTab.preventivas.length },
            { value: 'substituicoes', label: 'Substituição de equipamentos', count: byTab.substituicoes.length },
          ]}
        />
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Buscar nº, problema ou equipamento"
          hasFilters={!!(search || storeId || priority)}
          onClear={() => {
            setSearch('');
            setStoreId('');
            setPriority('');
          }}
          actions={
            <SegmentedControl
              size="sm"
              value={view}
              onChange={setView}
              items={[
                { value: 'lista', label: <List />, title: 'Lista' },
                { value: 'quadro', label: <LayoutGrid />, title: 'Quadro por status' },
              ]}
            />
          }
        >
          <FilterSelect value={storeId} onChange={setStoreId} allLabel="Todas as lojas" options={stores.map((s) => ({ value: s.id, label: s.name }))} />
          <FilterSelect value={priority} onChange={setPriority} allLabel="Todas as prioridades" options={Object.values(TicketPriority).map((p) => ({ value: p, label: TICKET_PRIORITY[p].label }))} />
        </FilterBar>
        {view === 'lista' ? (
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            rowKey={(t) => t.id}
            onRowClick={(t) => setOpen(t.id)}
            empty={{ icon: <Wrench />, title: 'Nenhum chamado', description: 'Não há registros para os filtros selecionados.' }}
          />
        ) : (
          <div className="flex gap-3 overflow-x-auto p-4">
            {TICKET_STATUS_FLOW.map((status) => {
              const items = rows.filter((t) => t.status === status);
              return (
                <div key={status} className="w-[260px] shrink-0 rounded-lg bg-slate-50 p-2">
                  <div className="mb-2 flex items-center justify-between px-1.5 py-1">
                    <span className="text-[13px] font-medium text-slate-700">{TICKET_STATUS[status].label}</span>
                    <span className="text-xs tabular-nums text-slate-400">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((t) => (
                      <button key={t.id} onClick={() => setOpen(t.id)} className="w-full rounded-md border border-slate-200 bg-white p-3 text-left shadow-card transition-colors hover:border-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-slate-500">#{t.number}</span>
                          <StatusBadge map={TICKET_PRIORITY} value={t.priority} dot={false} className="text-[11px]" />
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-slate-900">{t.problem}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{db.stores.get(t.storeId)?.name}</p>
                        <div className="mt-2.5">
                          <SlaIndicator ticket={t} />
                        </div>
                      </button>
                    ))}
                    {items.length === 0 && <p className={cn('px-2 py-4 text-center text-xs text-slate-400')}>Sem chamados</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {open && <TicketSheet key={open.id} ticket={open} onClose={() => setOpen()} />}
      {newOpen && (
        <NewTicketDialog
          open
          onClose={() => setNewOpen(false)}
          onCreated={(t) => {
            setNewOpen(false);
            setOpen(t.id);
          }}
        />
      )}
    </div>
  );
}
