import { CalendarClock, Check, ChevronRight, FileUp, Layers, Plus, Send, Tag, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BulkBar } from '@/components/shared/BulkBar';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterSelect } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, Switch } from '@/components/ui/form';
import { Tabs } from '@/components/ui/misc';
import { Dialog } from '@/components/ui/overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreScope } from '@/contexts/StoreScopeContext';
import { useToast } from '@/contexts/ToastContext';
import { useQuery } from '@/hooks/useQuery';
import { db, pricesService, settingsService } from '@/services';
import { PriceChangeStatus, type PriceChange } from '@/types';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDateTime, formatPercent, normalize, priceVariation, toDateTimeLocal } from '@/utils/format';
import { PRICE_SOURCE, PRICE_STATUS } from '@/utils/labels';
import { atDayOffset } from '@/utils/time';
import { BulkPriceDialog, ImportPriceDialog, NewPriceDialog } from './PriceDialogs';

type Tab = 'todas' | PriceChangeStatus.Rascunho | PriceChangeStatus.AguardandoAprovacao | 'aprovadas' | PriceChangeStatus.Publicado | PriceChangeStatus.Rejeitado;

const WORKFLOW = [
  { status: PriceChangeStatus.Rascunho, label: 'Rascunho', tab: PriceChangeStatus.Rascunho as Tab },
  { status: PriceChangeStatus.AguardandoAprovacao, label: 'Aguardando aprovação', tab: PriceChangeStatus.AguardandoAprovacao as Tab },
  { status: PriceChangeStatus.Aprovado, label: 'Aprovado / agendado', tab: 'aprovadas' as Tab },
  { status: PriceChangeStatus.Publicado, label: 'Publicado', tab: PriceChangeStatus.Publicado as Tab },
];

export default function PricesPage() {
  const toast = useToast();
  const { can } = useAuth();
  const { storeId: scopeStore } = useStoreScope();
  const [params, setParams] = useSearchParams();
  const { data, loading } = useQuery(() => pricesService.list(), []);
  const { data: settings } = useQuery(() => settingsService.get(), []);
  const [tab, setTab] = useState<Tab>('todas');
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState(scopeStore ?? '');
  const [selected, setSelected] = useState<string[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(toDateTimeLocal(atDayOffset(1, 7)));
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<PriceChange | null>(null);
  const initialProduct = params.get('novo') ?? undefined;

  useEffect(() => {
    if (initialProduct) setNewOpen(true);
  }, [initialProduct]);

  const products = db.products;
  const stores = db.stores;

  const inTab = (p: PriceChange, t: Tab) =>
    t === 'todas' || (t === 'aprovadas' ? p.status === PriceChangeStatus.Aprovado || p.status === PriceChangeStatus.Agendado : p.status === t);

  const base = useMemo(
    () =>
      (data ?? []).filter((p) => {
        if (storeFilter && p.storeId !== storeFilter && p.storeId !== 'all') return false;
        if (search) {
          const prod = products.get(p.productId);
          if (!normalize(`${prod?.shortName} ${prod?.sku} ${p.requestedBy}`).includes(normalize(search))) return false;
        }
        return true;
      }),
    [data, storeFilter, search, products],
  );
  const rows = useMemo(() => base.filter((p) => inTab(p, tab)), [base, tab]);
  const count = (t: Tab) => base.filter((p) => inTab(p, t)).length;
  const selectedRows = (data ?? []).filter((p) => selected.includes(p.id));
  const has = (...s: PriceChangeStatus[]) => selectedRows.filter((r) => s.includes(r.status)).length;

  const run = async (key: string, fn: () => Promise<unknown>, msg: string) => {
    setBusy(key);
    await fn();
    setBusy(null);
    setSelected([]);
    toast.success(msg);
  };

  const publish = async (ids: string[]) => {
    setBusy('publish');
    const t = toast.loading('Publicando…', `${ids.length} alteração(ões) de preço`);
    const res = await pricesService.publish(ids);
    setBusy(null);
    setSelected([]);
    toast.update(t, {
      tone: res.published ? 'success' : 'error',
      title: res.published ? 'Publicado com sucesso' : 'Nada para publicar',
      description: res.published ? `${res.published} preço(s) enviados às réguas${res.skipped ? ` · ${res.skipped} ignorado(s) por não estarem aprovados` : ''}.` : 'Somente alterações aprovadas podem ser publicadas.',
    });
  };

  const columns: Column<PriceChange>[] = [
    {
      key: 'product',
      header: 'Produto',
      cell: (p) => {
        const prod = products.get(p.productId);
        return (
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{prod?.shortName}</p>
            <p className="text-xs text-slate-500">{PRICE_SOURCE[p.source]} · {p.reason}</p>
          </div>
        );
      },
      sortValue: (p) => products.get(p.productId)?.shortName ?? '',
    },
    { key: 'sku', header: 'SKU', cell: (p) => <span className="font-mono text-[13px]">{products.get(p.productId)?.sku}</span>, hideBelow: 'xl' },
    { key: 'store', header: 'Loja', cell: (p) => (p.storeId === 'all' ? <span className="font-medium">Todas as lojas</span> : stores.get(p.storeId)?.name), sortValue: (p) => p.storeId, hideBelow: 'md' },
    { key: 'current', header: 'Preço atual', align: 'right', cell: (p) => <span className="text-slate-500">{formatCurrency(p.currentPrice)}</span>, sortValue: (p) => p.currentPrice, hideBelow: 'sm' },
    { key: 'new', header: 'Novo preço', align: 'right', cell: (p) => <span className="font-semibold text-slate-900">{formatCurrency(p.newPrice)}</span>, sortValue: (p) => p.newPrice },
    {
      key: 'var',
      header: 'Variação',
      align: 'right',
      cell: (p) => {
        const v = priceVariation(p.currentPrice, p.newPrice);
        return (
          <span className={cn('font-medium', v < 0 ? 'text-emerald-700' : 'text-red-700')}>
            {v > 0 ? '+' : ''}
            {formatPercent(v)}
            {p.requiresApproval && <span className="ml-1 text-amber-600" title="Requer aprovação de gerente">●</span>}
          </span>
        );
      },
      sortValue: (p) => priceVariation(p.currentPrice, p.newPrice),
    },
    { key: 'start', header: 'Início', cell: (p) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(p.startAt)}</span>, sortValue: (p) => p.startAt, hideBelow: 'lg' },
    { key: 'end', header: 'Fim', cell: (p) => <span className="whitespace-nowrap text-slate-600">{p.endAt ? formatDateTime(p.endAt) : '—'}</span>, sortValue: (p) => p.endAt ?? '', hideBelow: 'xl' },
    { key: 'status', header: 'Status', cell: (p) => <StatusBadge map={PRICE_STATUS} value={p.status} />, sortValue: (p) => p.status },
    { key: 'owner', header: 'Responsável', cell: (p) => <span className="whitespace-nowrap">{p.requestedBy}</span>, sortValue: (p) => p.requestedBy, hideBelow: 'lg' },
  ];

  return (
    <div>
      <PageHeader
        title="Central de preços"
        description="Crie, aprove e publique alterações de preço nas réguas digitais de todas as lojas."
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)} disabled={!can('prices.edit')}>
              <FileUp /> Importar preços
            </Button>
            <Button variant="outline" onClick={() => setBulkOpen(true)} disabled={!can('prices.edit')}>
              <Layers /> Alteração em massa
            </Button>
            <Button onClick={() => setNewOpen(true)} disabled={!can('prices.edit')}>
              <Plus /> Nova alteração
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_340px]">
        <Card className="flex flex-wrap items-stretch overflow-hidden">
          {WORKFLOW.map((w, i) => (
            <button
              key={w.status}
              onClick={() => setTab(w.tab)}
              className={cn('flex min-w-[140px] flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50', tab === w.tab && 'bg-brand-50/50')}
            >
              <div className="flex-1">
                <p className="text-xs text-slate-500">{w.label}</p>
                <p className="text-xl font-semibold tabular-nums text-slate-900">{count(w.tab)}</p>
              </div>
              {i < WORKFLOW.length - 1 && <ChevronRight className="hidden h-4 w-4 text-slate-300 sm:block" />}
            </button>
          ))}
        </Card>
        <Card className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Exigir aprovação de gerente</p>
            <p className="text-xs text-slate-500">
              {settings?.requireManagerApproval ? `Variações ≥ ${settings.approvalThresholdPct}% ou para toda a rede` : 'Desativado · publicação direta'}
            </p>
          </div>
          <Switch
            label="Exigir aprovação de gerente"
            disabled={!can('settings.manage')}
            checked={!!settings?.requireManagerApproval}
            onChange={async (v) => {
              await settingsService.update({ requireManagerApproval: v });
              toast.success(v ? 'Aprovação de gerente ativada' : 'Aprovação de gerente desativada');
            }}
          />
        </Card>
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
            { value: 'todas', label: 'Todas', count: count('todas') },
            { value: PriceChangeStatus.Rascunho, label: 'Rascunho', count: count(PriceChangeStatus.Rascunho) },
            { value: PriceChangeStatus.AguardandoAprovacao, label: 'Aguardando aprovação', count: count(PriceChangeStatus.AguardandoAprovacao) },
            { value: 'aprovadas', label: 'Aprovadas e agendadas', count: count('aprovadas') },
            { value: PriceChangeStatus.Publicado, label: 'Publicadas', count: count(PriceChangeStatus.Publicado) },
            { value: PriceChangeStatus.Rejeitado, label: 'Rejeitadas', count: count(PriceChangeStatus.Rejeitado) },
          ]}
        />
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Buscar produto, SKU ou responsável"
          hasFilters={!!(search || storeFilter)}
          onClear={() => {
            setSearch('');
            setStoreFilter('');
          }}
        >
          <FilterSelect value={storeFilter} onChange={setStoreFilter} allLabel="Todas as lojas" options={stores.all().map((s) => ({ value: s.id, label: s.name }))} />
        </FilterBar>
        <BulkBar count={selected.length} onClear={() => setSelected([])}>
          {has(PriceChangeStatus.Rascunho) > 0 && (
            <Button size="sm" variant="outline" loading={busy === 'submit'} onClick={() => run('submit', () => pricesService.submit(selected), 'Alterações enviadas para aprovação')}>
              <Send /> Enviar para aprovação
            </Button>
          )}
          {has(PriceChangeStatus.AguardandoAprovacao, PriceChangeStatus.Rascunho) > 0 && can('prices.approve') && (
            <>
              <Button size="sm" variant="outline" loading={busy === 'reject'} onClick={() => run('reject', () => pricesService.reject(selected), 'Alterações rejeitadas')}>
                <X /> Rejeitar
              </Button>
              <Button size="sm" variant="outline" loading={busy === 'approve'} onClick={() => run('approve', () => pricesService.approve(selected), 'Alterações aprovadas')}>
                <Check /> Aprovar
              </Button>
            </>
          )}
          {has(PriceChangeStatus.Aprovado) > 0 && (
            <Button size="sm" variant="outline" onClick={() => setScheduleOpen(true)}>
              <CalendarClock /> Agendar
            </Button>
          )}
          {has(PriceChangeStatus.Aprovado, PriceChangeStatus.Agendado) > 0 && can('prices.publish') && (
            <Button size="sm" loading={busy === 'publish'} onClick={() => publish(selected)}>
              <Send /> Publicar
            </Button>
          )}
        </BulkBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(p) => p.id}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          isRowSelectable={(p) => p.status !== PriceChangeStatus.Publicado && p.status !== PriceChangeStatus.Rejeitado}
          onRowClick={setDetail}
          pageSize={15}
          empty={{ icon: <Tag />, title: 'Nenhuma alteração de preço', description: 'Crie uma nova alteração ou ajuste os filtros.' }}
        />
      </Card>

      {detail && (
        <PriceDetailDialog
          change={(data ?? []).find((d) => d.id === detail.id) ?? detail}
          onClose={() => setDetail(null)}
          onPublish={(id) => publish([id])}
        />
      )}

      <NewPriceDialog
        key={initialProduct ?? 'new'}
        open={newOpen}
        initialProductId={initialProduct}
        onClose={() => {
          setNewOpen(false);
          if (initialProduct) {
            params.delete('novo');
            setParams(params, { replace: true });
          }
        }}
      />
      <BulkPriceDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
      <ImportPriceDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <Dialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Agendar publicação"
        description={`${has(PriceChangeStatus.Aprovado)} alteração(ões) aprovada(s) serão publicadas automaticamente.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Voltar
            </Button>
            <Button
              onClick={async () => {
                await pricesService.schedule(selected, new Date(scheduleAt).toISOString());
                setScheduleOpen(false);
                setSelected([]);
                toast.success('Publicação agendada', formatDateTime(new Date(scheduleAt).toISOString()));
              }}
            >
              Agendar
            </Button>
          </>
        }
      >
        <Field label="Data e hora de início">
          <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
        </Field>
      </Dialog>
    </div>
  );
}

function PriceDetailDialog({ change, onClose, onPublish }: { change: PriceChange; onClose: () => void; onPublish: (id: string) => void }) {
  const { can } = useAuth();
  const toast = useToast();
  const product = db.products.get(change.productId);
  const v = priceVariation(change.currentPrice, change.newPrice);
  const steps = [PriceChangeStatus.Rascunho, PriceChangeStatus.AguardandoAprovacao, PriceChangeStatus.Aprovado, PriceChangeStatus.Publicado];
  const idx = change.status === PriceChangeStatus.Agendado ? 2 : steps.indexOf(change.status);
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    await fn();
    toast.success(msg);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={product?.shortName ?? 'Alteração de preço'}
      description={`${change.storeId === 'all' ? 'Todas as lojas' : db.stores.get(change.storeId)?.name} · solicitado por ${change.requestedBy}`}
      footer={
        <>
          {change.status === PriceChangeStatus.Rascunho && (
            <Button variant="outline" onClick={() => act(() => pricesService.submit([change.id]), 'Enviado para aprovação')}>
              <Send /> Enviar para aprovação
            </Button>
          )}
          {[PriceChangeStatus.AguardandoAprovacao, PriceChangeStatus.Rascunho].includes(change.status) && can('prices.approve') && (
            <>
              <Button variant="outline" onClick={() => act(() => pricesService.reject([change.id]), 'Alteração rejeitada')}>
                Rejeitar
              </Button>
              <Button onClick={() => act(() => pricesService.approve([change.id]), 'Alteração aprovada')}>
                <Check /> Aprovar
              </Button>
            </>
          )}
          {[PriceChangeStatus.Aprovado, PriceChangeStatus.Agendado].includes(change.status) && can('prices.publish') && (
            <Button
              onClick={() => {
                onPublish(change.id);
                onClose();
              }}
            >
              <Send /> Publicar agora
            </Button>
          )}
          {change.status === PriceChangeStatus.Publicado && (
            <Link to="/auditoria">
              <Button variant="outline">Ver auditoria</Button>
            </Link>
          )}
        </>
      }
    >
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={cn(
                'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium',
                change.status === PriceChangeStatus.Rejeitado ? 'bg-slate-100 text-slate-400' : i < idx ? 'bg-emerald-50 text-emerald-700' : i === idx ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-500',
              )}
            >
              {PRICE_STATUS[s].label}
            </span>
            {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
          </div>
        ))}
      </div>
      {change.status === PriceChangeStatus.Rejeitado && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">Alteração rejeitada por {change.approvedBy}.</p>}
      <div className="mt-5 grid grid-cols-3 gap-3 rounded-lg border border-slate-200 p-4 text-center">
        <div>
          <p className="text-xs text-slate-500">Preço atual</p>
          <p className="mt-1 text-lg tabular-nums text-slate-500">{formatCurrency(change.currentPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Novo preço</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{formatCurrency(change.newPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Variação</p>
          <p className={cn('mt-1 text-lg font-medium tabular-nums', v < 0 ? 'text-emerald-700' : 'text-red-700')}>
            {v > 0 ? '+' : ''}
            {formatPercent(v)}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Início</dt>
          <dd>{formatDateTime(change.startAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Fim</dt>
          <dd>{change.endAt ? formatDateTime(change.endAt) : 'Sem data de término'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Origem</dt>
          <dd>{PRICE_SOURCE[change.source]}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Aprovação</dt>
          <dd>{change.approvedBy ? `${change.status === PriceChangeStatus.Rejeitado ? 'Rejeitado' : 'Aprovado'} por ${change.approvedBy}` : change.requiresApproval ? 'Requer gerente' : 'Não requerida'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500">Motivo</dt>
          <dd>{change.reason}</dd>
        </div>
      </dl>
    </Dialog>
  );
}
