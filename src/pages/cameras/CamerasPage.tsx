import { Cctv, CircleCheck, ExternalLink, PackageSearch, RefreshCw, ScanLine, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CameraFrame } from '@/components/shared/CameraFrame';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterSelect } from '@/components/shared/FilterBar';
import { KeyValueList } from '@/components/shared/KeyValue';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton, Tabs } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/overlay';
import { useToast } from '@/contexts/ToastContext';
import { useQuery } from '@/hooks/useQuery';
import { useScopedStore } from '@/hooks/useScopedStore';
import { camerasService, db, storesService, type CameraRow } from '@/services';
import { DeviceStatus, VisionEventType, type VisionEvent } from '@/types';
import { formatDateTime, formatInt, formatPercent, formatRelative } from '@/utils/format';
import { DEVICE_STATUS, VISION_EVENT } from '@/utils/labels';

function CameraSheet({ row, onClose }: { row: CameraRow; onClose: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { camera, store, gondola, events } = row;
  return (
    <Sheet
      open
      onClose={onClose}
      width="lg"
      title={`Câmera ${camera.code}`}
      description={`${store.name} · Gôndola ${gondola.code} · ${camera.aisle}`}
      footer={
        <>
          <Link to={`/gondolas/${gondola.id}`}>
            <Button variant="outline">
              <ExternalLink /> Abrir gôndola
            </Button>
          </Link>
          <Button
            loading={busy}
            disabled={camera.status === DeviceStatus.Offline}
            onClick={async () => {
              setBusy(true);
              await new Promise((r) => setTimeout(r, 1200));
              db.cameras.update(camera.id, { lastProcessedAt: new Date().toISOString() });
              setBusy(false);
              toast.success('Nova leitura processada', `${camera.code} · ${camera.productsDetected} produtos identificados`);
            }}
          >
            <RefreshCw /> Solicitar nova leitura
          </Button>
        </>
      }
    >
      <CameraFrame camera={camera} large />
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-3 border border-dashed border-red-600" /> Possível ruptura
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-3 border border-amber-600" /> Fora da posição
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Produtos detectados', value: `${camera.productsDetected}/${camera.productsExpected}` },
          { label: 'Rupturas', value: camera.ruptureCount },
          { label: 'Fora da posição', value: camera.misplacedCount },
          { label: 'Ocupação', value: formatPercent(camera.occupancyPct, 0) },
        ].map((m) => (
          <div key={m.label} className="rounded-md border border-slate-200 px-3 py-2">
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <KeyValueList
          items={[
            { label: 'Status', value: <StatusBadge map={DEVICE_STATUS} value={camera.status} /> },
            { label: 'Último processamento', value: formatDateTime(camera.lastProcessedAt) },
            { label: 'Modelo', value: camera.model },
            { label: 'Resolução', value: camera.resolution },
          ]}
        />
      </div>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-3 text-sm font-medium text-slate-900">Eventos recentes</p>
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum evento registrado para esta câmera.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="flex items-start gap-3 rounded-md border border-slate-100 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <StatusBadge map={VISION_EVENT} value={e.type} />
                  <p className="mt-1 text-sm text-slate-800">
                    {e.productId ? db.products.get(e.productId)?.shortName : 'Item sem identificação'} · prateleira {e.shelfLevel}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(e.detectedAt)} · confiança {formatPercent(e.confidence * 100, 0)}
                  </p>
                </div>
                {e.resolved ? (
                  <Badge tone="green">Tratado</Badge>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => camerasService.resolveEvent(e.id)}>
                    Marcar tratado
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}

export default function CamerasPage() {
  const { data, loading } = useQuery(() => camerasService.list(), []);
  const { data: events, loading: loadingEvents } = useQuery(() => camerasService.events(), []);
  const stores = storesService.listSync();
  const [storeId, setStoreId] = useScopedStore();
  const [status, setStatus] = useState<DeviceStatus | ''>('');
  const [tab, setTab] = useState<'cameras' | 'eventos'>('cameras');
  const [eventType, setEventType] = useState<VisionEventType | ''>('');
  const [openId, setOpenId] = useState<string | null>(null);

  const rank = { offline: 0, atencao: 1, manutencao: 2, online: 3 } as const;
  const rows = useMemo(
    () =>
      (data ?? [])
        .filter((r) => (!storeId || r.store.id === storeId) && (!status || r.camera.status === status))
        .sort((a, b) => rank[a.camera.status] - rank[b.camera.status] || b.camera.ruptureCount - a.camera.ruptureCount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, storeId, status],
  );
  const eventRows = useMemo(() => (events ?? []).filter((e) => (!storeId || e.storeId === storeId) && (!eventType || e.type === eventType)), [events, storeId, eventType]);
  const open = (data ?? []).find((r) => r.camera.id === openId);
  const scoped = rows;

  const eventColumns: Column<VisionEvent>[] = [
    { key: 'type', header: 'Evento', cell: (e) => <StatusBadge map={VISION_EVENT} value={e.type} />, sortValue: (e) => e.type },
    { key: 'product', header: 'Produto', cell: (e) => (e.productId ? db.products.get(e.productId)?.shortName : <span className="text-slate-400">Não identificado</span>) },
    { key: 'store', header: 'Loja', cell: (e) => db.stores.get(e.storeId)?.name, hideBelow: 'md' },
    { key: 'where', header: 'Local', cell: (e) => `${db.gondolas.get(e.gondolaId)?.code} · P${e.shelfLevel}`, hideBelow: 'sm' },
    { key: 'cam', header: 'Câmera', cell: (e) => <span className="font-mono text-[13px]">{db.cameras.get(e.cameraId)?.code}</span>, hideBelow: 'lg' },
    { key: 'conf', header: 'Confiança', align: 'right', cell: (e) => formatPercent(e.confidence * 100, 0), sortValue: (e) => e.confidence, hideBelow: 'lg' },
    { key: 'at', header: 'Detectado', cell: (e) => <span className="whitespace-nowrap text-slate-500">{formatRelative(e.detectedAt)}</span>, sortValue: (e) => e.detectedAt },
    { key: 'st', header: 'Situação', cell: (e) => (e.resolved ? <Badge tone="green">Tratado</Badge> : <Badge tone="outline">Pendente</Badge>), sortValue: (e) => Number(e.resolved) },
  ];

  return (
    <div>
      <PageHeader title="Câmeras e visão computacional" description="Monitoramento das gôndolas: presença de produtos, rupturas e posicionamento conforme planograma." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Câmeras online" icon={<Cctv />} loading={loading} value={`${scoped.filter((r) => r.camera.status === DeviceStatus.Online).length} / ${scoped.length}`} />
        <StatCard label="Produtos detectados" icon={<ScanLine />} loading={loading} value={formatInt(scoped.reduce((a, r) => a + r.camera.productsDetected, 0))} hint="última leitura" />
        <StatCard label="Possíveis rupturas" icon={<TriangleAlert />} loading={loading} value={scoped.reduce((a, r) => a + r.camera.ruptureCount, 0)} tone="warning" />
        <StatCard label="Fora da posição" icon={<PackageSearch />} loading={loading} value={scoped.reduce((a, r) => a + r.camera.misplacedCount, 0)} />
      </div>

      <Card className="mt-4">
        <Tabs
          className="px-2"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'cameras', label: 'Câmeras', count: rows.length },
            { value: 'eventos', label: 'Eventos de visão', count: eventRows.filter((e) => !e.resolved).length },
          ]}
        />
        <FilterBar
          hasFilters={!!(storeId || status || eventType)}
          onClear={() => {
            setStoreId('');
            setStatus('');
            setEventType('');
          }}
        >
          <FilterSelect value={storeId} onChange={setStoreId} allLabel="Todas as lojas" options={stores.map((s) => ({ value: s.id, label: s.name }))} />
          {tab === 'cameras' ? (
            <FilterSelect value={status} onChange={setStatus} allLabel="Todos os status" options={Object.values(DeviceStatus).map((s) => ({ value: s, label: DEVICE_STATUS[s].label }))} />
          ) : (
            <FilterSelect value={eventType} onChange={setEventType} allLabel="Todos os eventos" options={Object.values(VisionEventType).map((s) => ({ value: s, label: VISION_EVENT[s].label }))} />
          )}
        </FilterBar>
        {tab === 'cameras' ? (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {loading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[260px]" />)}
            {!loading && rows.length === 0 && <p className="col-span-full py-10 text-center text-sm text-slate-500">Nenhuma câmera encontrada.</p>}
            {rows.slice(0, 40).map((r) => (
              <button key={r.camera.id} onClick={() => setOpenId(r.camera.id)} className="rounded-lg border border-slate-200 p-2.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50">
                <CameraFrame camera={r.camera} />
                <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
                  <span className="font-mono text-[13px] font-semibold text-slate-900">{r.camera.code}</span>
                  <StatusBadge map={DEVICE_STATUS} value={r.camera.status} />
                </div>
                <p className="mt-0.5 truncate px-0.5 text-xs text-slate-500">
                  {r.store.name} · {r.gondola.code} · {r.camera.aisle}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-1 border-t border-slate-100 px-0.5 pt-2 text-xs">
                  <span className="text-slate-500">
                    Detect. <strong className="font-medium text-slate-900">{r.camera.productsDetected}</strong>
                  </span>
                  <span className="text-slate-500">
                    Ruptura <strong className={r.camera.ruptureCount ? 'font-medium text-red-600' : 'font-medium text-slate-900'}>{r.camera.ruptureCount}</strong>
                  </span>
                  <span className="text-slate-500">
                    Posição <strong className={r.camera.misplacedCount ? 'font-medium text-amber-700' : 'font-medium text-slate-900'}>{r.camera.misplacedCount}</strong>
                  </span>
                </div>
                <p className="mt-1.5 px-0.5 text-[11px] text-slate-400">Processado {formatRelative(r.camera.lastProcessedAt)}</p>
              </button>
            ))}
            {rows.length > 40 && (
              <p className="col-span-full text-center text-xs text-slate-500">Exibindo 40 de {rows.length} câmeras · selecione uma loja para refinar.</p>
            )}
          </div>
        ) : (
          <DataTable
            columns={eventColumns}
            rows={eventRows}
            loading={loadingEvents}
            rowKey={(e) => e.id}
            onRowClick={(e) => setOpenId(e.cameraId)}
            empty={{ icon: <CircleCheck />, title: 'Nenhum evento de visão', description: 'As gôndolas monitoradas estão conforme o planograma.' }}
          />
        )}
      </Card>
      {open && <CameraSheet key={open.camera.id} row={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
