import {
  Activity,
  ArrowRight,
  BellRing,
  CircleCheck,
  Columns3,
  Megaphone,
  Rows3,
  Store,
  Tag,
  TriangleAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/shared/ChartTooltip';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreScope } from '@/contexts/StoreScopeContext';
import { useQuery } from '@/hooks/useQuery';
import { getDashboard } from '@/services';
import { StoreStatus } from '@/types';
import { axisProps, CHART } from '@/utils/chart';
import { cn } from '@/utils/cn';
import { formatDateTime, formatInt, formatPercent, formatRelative } from '@/utils/format';

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center gap-4 text-xs text-slate-500">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { storeId } = useStoreScope();
  const { data, loading } = useQuery(() => getDashboard(storeId), [storeId]);
  const k = data?.kpis;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const scopeLabel = storeId ? data?.operation[0]?.store.name : 'todas as lojas';

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description={`${greeting}, ${user?.name.split(' ')[0]}. Indicadores de ${scopeLabel ?? '…'} · atualizado em ${formatDateTime(new Date().toISOString())}`}
        actions={
          <>
            <Link to="/precos">
              <Button variant="outline">
                <Tag /> Central de preços
              </Button>
            </Link>
            <Link to="/campanhas/nova">
              <Button>
                <Megaphone /> Nova campanha
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard loading={loading} label="Lojas ativas" icon={<Store />} value={k && formatInt(k.activeStores)} hint={k && `${k.totalStores - k.activeStores} em implantação`} to="/lojas" />
        <StatCard loading={loading} label="Gôndolas conectadas" icon={<Columns3 />} value={k && formatInt(k.gondolasConnected)} hint="com réguas e controlador" to="/gondolas" />
        <StatCard loading={loading} label="Réguas online" icon={<Rows3 />} value={k && formatInt(k.shelvesOnline)} hint={k && `de ${formatInt(k.shelvesTotal)} instaladas`} to="/reguas" tone="success" />
        <StatCard loading={loading} label="Dispositivos com problema" icon={<TriangleAlert />} value={k && formatInt(k.devicesWithProblem)} hint="offline ou em atenção" to="/monitoramento" tone={k && k.devicesWithProblem > 0 ? 'danger' : 'default'} />
        <StatCard loading={loading} label="Campanhas ativas" icon={<Megaphone />} value={k && formatInt(k.activeCampaigns)} hint="em exibição agora" to="/campanhas" />
        <StatCard loading={loading} label="Alterações de preço hoje" icon={<Tag />} value={k && formatInt(k.priceChangesToday)} trend={{ value: '8,2%', direction: 'up' }} hint="vs. média" to="/precos" />
        <StatCard loading={loading} label="Alertas de ruptura" icon={<BellRing />} value={k && formatInt(k.ruptureAlerts)} hint="câmeras e estoque" to="/cameras" tone="warning" />
        <StatCard loading={loading} label="Disponibilidade geral" icon={<Activity />} value={k && formatPercent(k.availability)} hint="meta contratual 99,0%" to="/monitoramento" tone="success" />
      </div>

      {k && k.pendingApprovals > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm">
          <TriangleAlert className="h-4 w-4 text-amber-600" />
          <span className="text-amber-900">
            <strong className="font-semibold">{k.pendingApprovals} itens</strong> aguardando aprovação de gerente (preços e campanhas).
          </span>
          <Link to="/precos" className="ml-auto inline-flex items-center gap-1 font-medium text-amber-900 hover:underline">
            Revisar agora <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Disponibilidade dos dispositivos"
            description="Percentual diário de réguas e câmeras operacionais · últimos 14 dias"
            actions={k && <Badge tone="green" dot>{formatPercent(k.availability)} agora</Badge>}
          />
          <CardContent>
            <Legend items={[{ label: 'Réguas digitais', color: CHART.primary }, { label: 'Câmeras', color: CHART.secondary }]} />
            <div className="mt-3 h-[240px]">
              {loading || !data ? (
                <Skeleton className="h-full" />
              ) : (
                <ResponsiveContainer>
                  <LineChart data={data.availability} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis {...axisProps} domain={[97, 100]} ticks={[97, 98, 99, 100]} tickFormatter={(v) => `${v}%`} width={52} />
                    <Tooltip content={<ChartTooltip suffix="%" digits={2} names={{ reguas: 'Réguas', cameras: 'Câmeras' }} />} cursor={{ stroke: '#cbd5e1' }} />
                    <Line type="monotone" dataKey="reguas" stroke={CHART.primary} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
                    <Line type="monotone" dataKey="cameras" stroke={CHART.secondary} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Alertas por categoria" description="Alertas abertos e reconhecidos" actions={<Link to="/alertas" className="text-[13px] font-medium text-brand-700 hover:underline">Ver alertas</Link>} />
          <CardContent>
            {loading || !data ? (
              <Skeleton className="h-[240px]" />
            ) : (
              <ul className="space-y-3.5">
                {data.alertsByCategory
                  .slice()
                  .sort((a, b) => b.value - a.value)
                  .map((c) => {
                    const max = Math.max(1, ...data.alertsByCategory.map((x) => x.value));
                    return (
                      <li key={c.name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-slate-700">{c.name}</span>
                          <span className="font-medium tabular-nums text-slate-900">{c.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${(c.value / max) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Alterações de preço por dia" description="Preços publicados nas réguas digitais · últimos 14 dias" />
          <CardContent>
            <div className="h-[220px]">
              {loading || !data ? (
                <Skeleton className="h-full" />
              ) : (
                <ResponsiveContainer>
                  <BarChart data={data.priceChanges} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="28%">
                    <CartesianGrid stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
                    <YAxis {...axisProps} width={44} />
                    <Tooltip content={<ChartTooltip names={{ value: 'Alterações' }} />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="value" fill={CHART.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Campanhas publicadas" description="Últimas 8 semanas" />
          <CardContent>
            <Legend items={[{ label: 'Publicadas', color: CHART.primary }, { label: 'Encerradas', color: CHART.secondary }]} />
            <div className="mt-3 h-[190px]">
              {loading || !data ? (
                <Skeleton className="h-full" />
              ) : (
                <ResponsiveContainer>
                  <BarChart data={data.campaigns} margin={{ top: 8, right: 0, left: -24, bottom: 0 }} barGap={2}>
                    <CartesianGrid stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis {...axisProps} allowDecimals={false} width={40} />
                    <Tooltip content={<ChartTooltip names={{ publicadas: 'Publicadas', encerradas: 'Encerradas' }} />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="publicadas" fill={CHART.primary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="encerradas" fill={CHART.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Status da operação"
            description="Situação de cada loja em tempo real"
            actions={
              <Link to="/monitoramento" className="text-[13px] font-medium text-brand-700 hover:underline">
                Monitoramento
              </Link>
            }
          />
          <div className="divide-y divide-slate-100">
            {loading || !data
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3">
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                ))
              : data.operation.slice(0, 8).map((s) => {
                  const ok = s.issues.length === 0;
                  const impl = s.store.status === StoreStatus.Implantacao;
                  return (
                    <Link key={s.store.id} to={`/lojas/${s.store.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
                      {impl ? (
                        <Activity className="h-4 w-4 shrink-0 text-brand-600" />
                      ) : ok ? (
                        <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <TriangleAlert className={cn('h-4 w-4 shrink-0', s.criticalAlerts ? 'text-red-600' : 'text-amber-500')} />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm">
                        <span className="font-medium text-slate-900">Loja {s.store.name}</span>
                        <span className="text-slate-500"> — {impl ? 'Implantação em andamento' : ok ? 'Operação normal' : s.issues.join(' · ')}</span>
                      </span>
                      <span className="hidden text-xs text-slate-400 sm:inline">{formatRelative(s.store.lastSeenAt)}</span>
                    </Link>
                  );
                })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Lojas com mais ocorrências" description="Alertas abertos e chamados em andamento" />
          <CardContent>
            <Legend items={[{ label: 'Alertas', color: CHART.primary }, { label: 'Chamados', color: CHART.secondary }]} />
            <div className="mt-3 h-[260px]">
              {loading || !data ? (
                <Skeleton className="h-full" />
              ) : (
                <ResponsiveContainer>
                  <BarChart data={data.topStores} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barGap={2}>
                    <CartesianGrid stroke={CHART.grid} horizontal={false} />
                    <XAxis type="number" {...axisProps} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" {...axisProps} width={112} tick={{ fill: '#475569', fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip names={{ alertas: 'Alertas', chamados: 'Chamados' }} />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="alertas" stackId="a" fill={CHART.primary} />
                    <Bar dataKey="chamados" stackId="a" fill={CHART.secondary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
