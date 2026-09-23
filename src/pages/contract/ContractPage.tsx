import { ArrowDown, Check, Download, FileText, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { ServiceStageTrack } from '@/components/shared/ServiceStageTrack';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/contexts/ToastContext';
import { plansSeed } from '@/data/misc';
import { CLIENT_NAME } from '@/data/stores';
import { useQuery } from '@/hooks/useQuery';
import { monitoringService, storesService } from '@/services';
import { ServiceStage } from '@/types';
import { cn } from '@/utils/cn';
import { formatDate, formatPercent } from '@/utils/format';
import { SERVICE_STAGE_LABEL, SERVICE_STAGES } from '@/utils/labels';
import { daysAgo } from '@/utils/time';

const COMPARISON: { label: string; managed: boolean | string; full: boolean | string }[] = [
  { label: 'Plataforma iMart Control', managed: true, full: true },
  { label: 'Monitoramento remoto 24/7', managed: true, full: true },
  { label: 'Suporte técnico remoto', managed: true, full: true },
  { label: 'Atualização de software e firmware', managed: true, full: true },
  { label: 'Manutenção preventiva', managed: 'Trimestral', full: 'Mensal' },
  { label: 'Relatórios mensais e acompanhamento de SLA', managed: true, full: true },
  { label: 'Réguas digitais, controladores e câmeras', managed: 'Do cliente', full: 'Inclusos' },
  { label: 'Instalação e mapeamento de novas lojas', managed: 'Avulso', full: true },
  { label: 'Substituição de equipamentos', managed: false, full: 'Conforme contrato' },
  { label: 'Tempo de visita técnica', managed: 'Até 24h', full: 'Até 8h' },
];

const REPORTS = [0, 1, 2, 3].map((i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i - 1);
  return { id: `r${i}`, label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), availability: [99.52, 99.41, 99.63, 99.38][i], tickets: [38, 44, 31, 47][i] };
});

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-emerald-600" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-slate-300" />;
  return <span className="text-[13px] text-slate-700">{value}</span>;
}

export default function ContractPage() {
  const toast = useToast();
  const plans = plansSeed();
  const { data: kpis } = useQuery(() => monitoringService.kpis(), []);
  const { data: stores } = useQuery(() => storesService.list(), []);

  return (
    <div>
      <PageHeader
        title="Contrato & Serviços"
        description={`Serviço iMart contratado por ${CLIENT_NAME}: plataforma, operação e manutenção como serviço recorrente.`}
        actions={
          <Button variant="outline" onClick={() => toast.success('Solicitação enviada', 'Seu gerente de contas iMart entrará em contato.')}>
            Falar com gerente de contas
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Disponibilidade no mês" value={kpis ? formatPercent(kpis.availability) : undefined} loading={!kpis} hint="meta contratual 99,0%" tone="success" />
        <StatCard label="Atendimento remoto" value="1h 42min" hint="tempo médio · meta 4h" />
        <StatCard label="Chamados no mês" value="41" hint="96% dentro do SLA" />
        <StatCard label="Preventivas realizadas" value="12 / 14" hint="2 agendadas" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} className={cn(plan.current && 'border-brand-300 ring-1 ring-brand-200')}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                  {plan.current && <Badge tone="blue">Plano atual</Badge>}
                </div>
                <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Investimento</p>
                <p className="text-sm font-semibold text-slate-900">{plan.price}</p>
              </div>
            </div>
            <CardContent>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">Serviços incluídos</p>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {plan.services.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {s}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-[13px] text-slate-500">{plan.sla}</p>
                {plan.current ? (
                  <span className="text-[13px] text-slate-500">Vigência até {formatDate(new Date(new Date().getFullYear() + 1, 11, 31).toISOString())}</span>
                ) : (
                  <Button variant="outline" onClick={() => toast.success('Proposta solicitada', `${plan.name} · retorno em até 2 dias úteis.`)}>
                    Solicitar proposta
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader title="Comparativo de planos" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs text-slate-500">
                <th className="px-5 py-2.5 text-left font-medium">Serviço</th>
                <th className="w-44 px-5 py-2.5 text-center font-medium">iMart Managed</th>
                <th className="w-44 px-5 py-2.5 text-center font-medium">iMart Full Service</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-2.5 text-slate-700">{row.label}</td>
                  <td className="px-5 py-2.5 text-center">
                    <Cell value={row.managed} />
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <Cell value={row.full} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Fluxo operacional do serviço" description="Etapas de implantação e operação contínua de cada loja." />
        <CardContent>
          <div className="hidden lg:block">
            <ServiceStageTrack />
          </div>
          <ol className="space-y-1 lg:hidden">
            {SERVICE_STAGES.map((s, i) => (
              <li key={s.value}>
                <div className="rounded-md border border-slate-200 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">
                    {i + 1}. {s.label}
                  </p>
                  <p className="text-xs text-slate-500">{s.description}</p>
                </div>
                {i < SERVICE_STAGES.length - 1 && <ArrowDown className="mx-auto my-1 h-4 w-4 text-slate-300" />}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader title="Etapa atual por loja" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs text-slate-500">
                  <th className="px-5 py-2.5 font-medium">Loja</th>
                  <th className="px-5 py-2.5 font-medium">Etapa</th>
                  <th className="px-5 py-2.5 font-medium">Progresso</th>
                  <th className="px-5 py-2.5 font-medium">Go-live</th>
                </tr>
              </thead>
              <tbody>
                {(stores ?? []).map(({ store }) => {
                  const idx = SERVICE_STAGES.findIndex((s) => s.value === store.stage);
                  const operating = idx >= SERVICE_STAGES.findIndex((s) => s.value === ServiceStage.GoLive);
                  return (
                    <tr key={store.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-2.5">
                        <Link to={`/lojas/${store.id}`} className="text-slate-900 hover:text-brand-700">
                          {store.name}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5">
                        <Badge tone={operating ? 'green' : 'blue'}>{SERVICE_STAGE_LABEL[store.stage]}</Badge>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex gap-0.5">
                          {SERVICE_STAGES.map((s, i) => (
                            <span key={s.value} className={cn('h-1.5 w-4 rounded-full', i <= idx ? (operating ? 'bg-emerald-500' : 'bg-brand-600') : 'bg-slate-200')} />
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-slate-500">{formatDate(store.goLiveAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="Relatórios mensais" description="Disponibilidade, chamados e SLA" />
          <ul className="divide-y divide-slate-100">
            {REPORTS.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                <FileText className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize text-slate-900">{r.label}</p>
                  <p className="text-xs text-slate-500">
                    Disponibilidade {formatPercent(r.availability, 2)} · {r.tickets} chamados
                  </p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Baixar relatório" onClick={() => toast.success('Download iniciado', `relatorio-imart-${r.label.replace(' de ', '-')}.pdf`)}>
                  <Download />
                </Button>
              </li>
            ))}
          </ul>
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Contrato iniciado em {formatDate(daysAgo(412))}</p>
        </Card>
      </div>
    </div>
  );
}
