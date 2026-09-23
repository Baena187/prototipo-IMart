import { Cctv, Columns3, MapPin, Megaphone, Phone, Rows3, TriangleAlert, Wrench } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { KeyValueList } from '@/components/shared/KeyValue';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { ServiceStageTrack } from '@/components/shared/ServiceStageTrack';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/misc';
import { useQuery } from '@/hooks/useQuery';
import { storesService } from '@/services';
import { AlertStatus, DeviceStatus, TicketStatus } from '@/types';
import { formatDate, formatInt, formatPercent, formatRelative } from '@/utils/format';
import { ALERT_SEVERITY, CAMPAIGN_STATUS, DEVICE_STATUS, STORE_STATUS, TICKET_STATUS } from '@/utils/labels';

export default function StoreDetailPage() {
  const { id = '' } = useParams();
  const { data, loading } = useQuery(() => storesService.get(id), [id]);

  if (loading) return <PageSkeleton />;
  if (!data)
    return (
      <Card>
        <EmptyState title="Loja não encontrada" action={<Link to="/lojas"><Button variant="outline">Voltar para lojas</Button></Link>} />
      </Card>
    );

  const { store } = data;
  const shelfHealth = data.shelves ? (data.shelvesOnline / data.shelves) * 100 : 0;
  const camHealth = data.cameras ? (data.camerasOnline / data.cameras) * 100 : 0;
  const openAlerts = data.alerts.filter((a) => a.status !== AlertStatus.Resolvido);
  const openTickets = data.tickets.filter((t) => t.status !== TicketStatus.Resolvido);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Lojas', to: '/lojas' }, { label: store.name }]}
        title={store.displayName}
        meta={
          <>
            <StatusBadge map={STORE_STATUS} value={store.status} />
            <Badge tone="outline">{store.code}</Badge>
            <span className="inline-flex items-center gap-1 text-[13px] text-slate-500">
              <MapPin className="h-3.5 w-3.5" /> {store.city}/{store.uf}
            </span>
            <span className="text-[13px] text-slate-500">· Última comunicação {formatRelative(store.lastSeenAt)}</span>
          </>
        }
        actions={
          <>
            <Link to="/monitoramento">
              <Button variant="outline">Monitoramento</Button>
            </Link>
            <Link to={`/gondolas?loja=${store.id}`}>
              <Button>
                <Columns3 /> Ver gôndolas
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Gôndolas" icon={<Columns3 />} value={formatInt(data.gondolas)} hint={`${data.gondolaList.filter((g) => g.status === DeviceStatus.Online).length} sem ocorrências`} />
        <StatCard label="Réguas digitais" icon={<Rows3 />} value={`${formatInt(data.shelvesOnline)} / ${formatInt(data.shelves)}`} hint="online" tone={data.shelvesOnline < data.shelves ? 'warning' : 'success'} />
        <StatCard label="Câmeras" icon={<Cctv />} value={`${data.camerasOnline} / ${data.cameras}`} hint="online" />
        <StatCard label="Alertas abertos" icon={<TriangleAlert />} value={openAlerts.length} hint={`${data.criticalAlerts} críticos`} tone={data.criticalAlerts ? 'danger' : 'default'} to="/alertas" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Informações gerais" />
          <CardContent>
            <KeyValueList
              columns={3}
              items={[
                { label: 'Endereço', value: store.address },
                { label: 'Região', value: store.region },
                { label: 'Gerente', value: store.manager },
                { label: 'Telefone', value: <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" /> {store.phone}</span> },
                { label: 'Área de vendas', value: `${formatInt(store.areaM2)} m²` },
                { label: 'Checkouts', value: store.checkouts },
                { label: store.goLiveAt > new Date().toISOString() ? 'Go-live previsto' : 'Go-live', value: formatDate(store.goLiveAt) },
                { label: 'Plano de serviço', value: 'iMart Managed' },
              ]}
            />
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="mb-3 text-[13px] font-medium text-slate-700">Ciclo de serviço iMart</p>
              <ServiceStageTrack current={store.stage} compact />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Saúde dos dispositivos" />
          <CardContent className="space-y-5">
            {[
              { label: 'Réguas digitais', value: shelfHealth, detail: `${data.shelvesOnline} de ${data.shelves}` },
              { label: 'Câmeras', value: camHealth, detail: `${data.camerasOnline} de ${data.cameras}` },
              { label: 'Controladores', value: data.gondolas ? 100 : 0, detail: `${data.gondolas} de ${data.gondolas}` },
            ].map((h) => (
              <div key={h.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-slate-700">{h.label}</span>
                  <span className="tabular-nums text-slate-500">
                    {h.detail} · <span className="font-medium text-slate-900">{formatPercent(h.value)}</span>
                  </span>
                </div>
                <Progress value={h.value} tone={h.value >= 99 ? 'green' : h.value >= 95 ? 'amber' : 'red'} />
              </div>
            ))}
            {data.issues.length > 0 && (
              <div className="rounded-md bg-amber-50 px-3 py-2 text-[13px] text-amber-900">{data.issues.join(' · ')}</div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Gôndolas" description={`${data.gondolaList.length} gôndolas mapeadas`} actions={<Link to={`/gondolas?loja=${store.id}`} className="text-[13px] font-medium text-brand-700 hover:underline">Ver todas</Link>} />
          {data.gondolaList.length === 0 ? (
            <EmptyState title="Nenhuma gôndola cadastrada" description="O mapeamento da loja ainda não foi concluído." />
          ) : (
            <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
              {data.gondolaList.slice(0, 9).map((g) => (
                <Link key={g.id} to={`/gondolas/${g.id}`} className="bg-white px-5 py-3.5 transition-colors hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">Gôndola {g.code}</span>
                    <StatusBadge map={DEVICE_STATUS} value={g.status} />
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-slate-500">
                    {g.aisle} · {g.shelfCount} réguas · {g.cameraIds.length} câm.
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Campanhas" actions={<Link to="/campanhas" className="text-[13px] font-medium text-brand-700 hover:underline">Ver todas</Link>} />
          <ul className="divide-y divide-slate-100">
            {data.campaigns.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link to={`/campanhas/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <Megaphone className="h-4 w-4 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{c.name}</span>
                  <StatusBadge map={CAMPAIGN_STATUS} value={c.status} />
                </Link>
              </li>
            ))}
            {data.campaigns.length === 0 && <li className="px-5 py-6 text-center text-sm text-slate-500">Nenhuma campanha para esta loja.</li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Alertas" description={`${openAlerts.length} em aberto`} />
          <ul className="divide-y divide-slate-100">
            {data.alerts.slice(0, 6).map((a) => (
              <li key={a.id} className="px-5 py-3">
                <div className="flex items-start gap-2">
                  <StatusBadge map={ALERT_SEVERITY} value={a.severity} />
                  <span className="text-xs text-slate-400">{formatRelative(a.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-800">{a.title}</p>
              </li>
            ))}
            {data.alerts.length === 0 && <li className="px-5 py-6 text-center text-sm text-slate-500">Nenhum alerta registrado.</li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Chamados" description={`${openTickets.length} em andamento`} actions={<Link to="/operacoes" className="text-[13px] font-medium text-brand-700 hover:underline">Operações</Link>} />
          <ul className="divide-y divide-slate-100">
            {data.tickets.slice(0, 5).map((t) => (
              <li key={t.id}>
                <Link to={`/operacoes?chamado=${t.id}`} className="block px-5 py-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-500">
                      <Wrench className="h-3.5 w-3.5" /> #{t.number}
                    </span>
                    <StatusBadge map={TICKET_STATUS} value={t.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-800">{t.problem}</p>
                </Link>
              </li>
            ))}
            {data.tickets.length === 0 && <li className="px-5 py-6 text-center text-sm text-slate-500">Nenhum chamado para esta loja.</li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Histórico recente" actions={<Link to="/auditoria" className="text-[13px] font-medium text-brand-700 hover:underline">Auditoria</Link>} />
          <CardContent>
            {data.recent.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">Sem eventos recentes.</p>
            ) : (
              <Timeline
                items={data.recent.slice(0, 5).map((e) => ({
                  id: e.id,
                  at: e.at,
                  title: e.summary,
                  description: e.previousValue || e.newValue ? `${e.previousValue ?? '—'} → ${e.newValue ?? '—'}` : undefined,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
