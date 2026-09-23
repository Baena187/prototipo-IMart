import { Activity, Cctv, Cpu, ExternalLink, RefreshCw, Router, Rows3, Server, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterSelect } from '@/components/shared/FilterBar';
import { KeyValueList } from '@/components/shared/KeyValue';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress, Tabs } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useQuery } from '@/hooks/useQuery';
import { useScopedStore } from '@/hooks/useScopedStore';
import { monitoringService, storesService, ticketsService, type DeviceRow } from '@/services';
import { DeviceStatus, DeviceType, TicketKind, TicketPriority } from '@/types';
import { cn } from '@/utils/cn';
import { formatDateTime, formatInt, formatPercent, formatRelative, formatUptime, normalize } from '@/utils/format';
import { DEVICE_STATUS, DEVICE_TYPE } from '@/utils/labels';

type TypeTab = 'todos' | DeviceType;

const TYPE_ICON: Record<DeviceType, typeof Rows3> = {
  [DeviceType.Regua]: Rows3,
  [DeviceType.Controlador]: Cpu,
  [DeviceType.Gateway]: Router,
  [DeviceType.Camera]: Cctv,
  [DeviceType.Sincronizacao]: Server,
};

function SignalBars({ dbm }: { dbm: number }) {
  const level = dbm <= -90 ? 0 : dbm > -50 ? 4 : dbm > -60 ? 3 : dbm > -70 ? 2 : 1;
  return (
    <span className="inline-flex items-end gap-0.5" title={`${dbm} dBm`}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={cn('w-1 rounded-sm', i <= level ? 'bg-slate-700' : 'bg-slate-200')} style={{ height: 3 + i * 3 }} />
      ))}
    </span>
  );
}

function DeviceSheet({ device, onClose }: { device: DeviceRow; onClose: () => void }) {
  const toast = useToast();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const Icon = TYPE_ICON[device.type];
  const hasTelemetry = device.type !== DeviceType.Sincronizacao;

  return (
    <Sheet
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" /> {device.code}
        </span>
      }
      description={`${DEVICE_TYPE[device.type]} · ${device.storeName}`}
      footer={
        <>
          <Button
            variant="outline"
            disabled={!can('operations.manage')}
            loading={busy === 'ticket'}
            onClick={async () => {
              setBusy('ticket');
              const t = await ticketsService.create({
                kind: TicketKind.Corretivo,
                storeId: device.storeId,
                equipment: `${DEVICE_TYPE[device.type]} ${device.code}`,
                problem: device.status === DeviceStatus.Offline ? 'Dispositivo sem comunicação' : 'Dispositivo em atenção',
                description: `Aberto a partir do monitoramento. Último heartbeat: ${formatDateTime(device.lastHeartbeatAt)}.`,
                priority: device.status === DeviceStatus.Offline ? TicketPriority.Alta : TicketPriority.Media,
              });
              setBusy(null);
              toast.success(`Chamado ${t.number} aberto`, device.code);
              navigate(`/operacoes?chamado=${t.id}`);
            }}
          >
            <Wrench /> Abrir chamado
          </Button>
          <Button
            disabled={!can('devices.manage')}
            loading={busy === 'restart'}
            onClick={async () => {
              setBusy('restart');
              const t = toast.loading('Enviando comando de reinicialização…', device.code);
              await monitoringService.restart(device);
              setBusy(null);
              toast.update(t, { tone: 'success', title: 'Dispositivo reiniciado', description: `${device.code} voltou a responder.` });
              onClose();
            }}
          >
            <RefreshCw /> Reiniciar remotamente
          </Button>
        </>
      }
    >
      <div className="mb-5 flex items-center gap-2">
        <StatusBadge map={DEVICE_STATUS} value={device.status} />
        <span className="text-[13px] text-slate-500">Último heartbeat {formatRelative(device.lastHeartbeatAt)}</span>
      </div>
      <KeyValueList
        items={[
          { label: 'Tipo', value: DEVICE_TYPE[device.type] },
          { label: 'Modelo', value: device.model },
          { label: 'Localização', value: device.location },
          { label: 'Loja', value: <Link to={`/lojas/${device.storeId}`} className="text-brand-700 hover:underline">{device.storeName}</Link> },
          { label: 'Endereço IP', value: <span className="font-mono text-[13px]">{device.ip}</span> },
          { label: 'Firmware', value: <span className="font-mono text-[13px]">{device.firmware}</span> },
          { label: 'Último heartbeat', value: formatDateTime(device.lastHeartbeatAt) },
          { label: 'Última publicação recebida', value: device.lastPublishAt ? formatDateTime(device.lastPublishAt) : '—' },
          { label: 'Uptime', value: device.uptimeHours ? formatUptime(device.uptimeHours) : '—' },
        ]}
      />
      {hasTelemetry && (
        <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
          <div>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-slate-600">Temperatura</span>
              <span className="tabular-nums text-slate-900">{device.temperatureC ? `${device.temperatureC} °C` : '—'}</span>
            </div>
            <Progress value={(device.temperatureC / 70) * 100} tone={device.temperatureC > 55 ? 'red' : device.temperatureC > 48 ? 'amber' : 'green'} />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-slate-600">Intensidade de sinal</span>
              <span className="tabular-nums text-slate-900">{device.signalDbm > -99 ? `${device.signalDbm} dBm` : 'Sem sinal'}</span>
            </div>
            <Progress value={Math.max(0, ((device.signalDbm + 100) / 60) * 100)} tone={device.signalDbm < -75 ? 'red' : device.signalDbm < -65 ? 'amber' : 'green'} />
          </div>
        </div>
      )}
      {device.link && (
        <Link to={device.link} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
          {device.type === DeviceType.Regua ? 'Abrir editor da régua' : 'Abrir módulo'} <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}
    </Sheet>
  );
}

export default function MonitoringPage() {
  const { data, loading } = useQuery(() => monitoringService.list(), []);
  const { data: kpis } = useQuery(() => monitoringService.kpis(), []);
  const stores = storesService.listSync();
  const [storeId, setStoreId] = useScopedStore();
  const [tab, setTab] = useState<TypeTab>('todos');
  const [status, setStatus] = useState<DeviceStatus | ''>('');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const base = useMemo(
    () =>
      (data ?? []).filter(
        (d) =>
          (!storeId || d.storeId === storeId) &&
          (!status || d.status === status) &&
          (!search || normalize(`${d.code} ${d.location} ${d.ip} ${d.storeName}`).includes(normalize(search))),
      ),
    [data, storeId, status, search],
  );
  const rows = base.filter((d) => tab === 'todos' || d.type === tab);
  const count = (t: TypeTab) => base.filter((d) => t === 'todos' || d.type === t).length;
  const open = (data ?? []).find((d) => d.id === openId);

  const columns: Column<DeviceRow>[] = [
    {
      key: 'code',
      header: 'Dispositivo',
      cell: (d) => {
        const Icon = TYPE_ICON[d.type];
        return (
          <div className="flex items-center gap-2.5">
            <Icon className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="font-mono text-[13px] font-semibold text-slate-900">{d.code}</p>
              <p className="truncate text-xs text-slate-500">{DEVICE_TYPE[d.type]}</p>
            </div>
          </div>
        );
      },
      sortValue: (d) => d.code,
    },
    { key: 'store', header: 'Loja', cell: (d) => <div><p>{d.storeName}</p><p className="max-w-[220px] truncate text-xs text-slate-500">{d.location}</p></div>, sortValue: (d) => d.storeName, hideBelow: 'md' },
    { key: 'status', header: 'Status', cell: (d) => <StatusBadge map={DEVICE_STATUS} value={d.status} />, sortValue: (d) => ({ offline: 0, atencao: 1, manutencao: 2, online: 3 })[d.status] },
    { key: 'hb', header: 'Último heartbeat', cell: (d) => <span className={cn('whitespace-nowrap', d.status === DeviceStatus.Offline ? 'text-red-600' : 'text-slate-600')}>{formatRelative(d.lastHeartbeatAt)}</span>, sortValue: (d) => d.lastHeartbeatAt },
    { key: 'ip', header: 'IP', cell: (d) => <span className="font-mono text-[13px] text-slate-600">{d.ip}</span>, hideBelow: 'xl' },
    { key: 'fw', header: 'Firmware', cell: (d) => <span className="font-mono text-[13px] text-slate-600">{d.firmware}</span>, sortValue: (d) => d.firmware, hideBelow: 'lg' },
    { key: 'temp', header: 'Temp.', align: 'right', cell: (d) => (d.temperatureC ? <span className={cn(d.temperatureC > 55 && 'text-red-600')}>{d.temperatureC} °C</span> : '—'), sortValue: (d) => d.temperatureC, hideBelow: 'lg' },
    { key: 'sig', header: 'Sinal', cell: (d) => (d.signalDbm ? <SignalBars dbm={d.signalDbm} /> : '—'), sortValue: (d) => d.signalDbm, hideBelow: 'xl' },
    { key: 'up', header: 'Uptime', align: 'right', cell: (d) => (d.uptimeHours ? formatUptime(d.uptimeHours) : '—'), sortValue: (d) => d.uptimeHours, hideBelow: 'xl' },
    { key: 'pub', header: 'Última publicação', cell: (d) => <span className="whitespace-nowrap text-slate-500">{d.lastPublishAt ? formatRelative(d.lastPublishAt) : '—'}</span>, sortValue: (d) => d.lastPublishAt ?? '', hideBelow: 'xl' },
  ];

  return (
    <div>
      <PageHeader title="Monitoramento" description="Saúde em tempo real de réguas, controladores, gateways, câmeras e serviços de sincronização." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Disponibilidade geral" icon={<Activity />} value={kpis ? formatPercent(kpis.availability) : undefined} loading={!kpis} tone="success" hint="meta contratual 99,0%" />
        <StatCard label="Réguas online" icon={<Rows3 />} value={kpis && `${formatInt(kpis.shelvesOnline)} / ${formatInt(kpis.shelvesTotal)}`} loading={!kpis} />
        <StatCard label="Câmeras online" icon={<Cctv />} value={kpis && `${kpis.camerasOnline} / ${kpis.camerasTotal}`} loading={!kpis} />
        <StatCard label="Controladores" icon={<Cpu />} value={kpis && `${kpis.controllersOnline} / ${kpis.controllersTotal}`} loading={!kpis} />
        <StatCard label="Com problema" icon={<Wrench />} value={kpis?.problems} loading={!kpis} tone="danger" hint="offline ou atenção" />
      </div>
      <Card className="mt-4">
        <Tabs
          className="px-2"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'todos', label: 'Todos', count: count('todos') },
            { value: DeviceType.Regua, label: 'Réguas LED', count: count(DeviceType.Regua) },
            { value: DeviceType.Controlador, label: 'Controladores', count: count(DeviceType.Controlador) },
            { value: DeviceType.Gateway, label: 'Gateways', count: count(DeviceType.Gateway) },
            { value: DeviceType.Camera, label: 'Câmeras', count: count(DeviceType.Camera) },
            { value: DeviceType.Sincronizacao, label: 'Sincronização', count: count(DeviceType.Sincronizacao) },
          ]}
        />
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Buscar código, IP ou local"
          hasFilters={!!(search || status || storeId)}
          onClear={() => {
            setSearch('');
            setStatus('');
            setStoreId('');
          }}
        >
          <FilterSelect value={storeId} onChange={setStoreId} allLabel="Todas as lojas" options={stores.map((s) => ({ value: s.id, label: s.name }))} />
          <FilterSelect value={status} onChange={setStatus} allLabel="Todos os status" options={Object.values(DeviceStatus).map((s) => ({ value: s, label: DEVICE_STATUS[s].label }))} />
        </FilterBar>
        <DataTable columns={columns} rows={rows} loading={loading} rowKey={(d) => d.id} onRowClick={(d) => setOpenId(d.id)} defaultSort={{ key: 'status', dir: 'asc' }} pageSize={20} />
      </Card>
      {open && <DeviceSheet key={open.id} device={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
