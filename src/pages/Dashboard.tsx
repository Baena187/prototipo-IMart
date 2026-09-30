import { ArrowRight, CalendarCheck, CalendarClock, CalendarPlus, CheckCircle2, Clock, Hourglass, MapPin, Play, Sun, Square, Users } from 'lucide-react';
import type { Tasting } from '../types';
import { useApp } from '../store';
import { addDays, dayNum, fmtBR, fmtLong, monthKey, monthShort, startOfWeek } from '../lib/dates';
import { isOpen, isPending } from '../lib/status';
import { AgendaCalendar } from '../components/CalendarView';
import { TastingTable } from '../components/TastingTable';
import { useTastingDialogs } from '../components/TastingActions';
import { Button, Card, CardHeader, EmptyState, PageHeader, StatCard, StatusBadge } from '../components/ui';

export function Dashboard() {
  const { role } = useApp();
  if (role === 'vendedor') return <SellerDash />;
  if (role === 'promotor') return <PromoterDash />;
  return <ManagerDash />;
}

function DateBlock({ iso, tone = 'navy' }: { iso: string; tone?: 'navy' | 'accent' }) {
  return (
    <div className={`w-14 shrink-0 rounded-xl py-2 text-center ${tone === 'accent' ? 'bg-accent-50 text-accent-700' : 'bg-navy-50 text-navy-800'}`}>
      <div className="text-xl font-bold leading-none">{dayNum(iso)}</div>
      <div className="mt-1 text-[11px] font-bold tracking-wide">{monthShort(iso)}</div>
    </div>
  );
}

function SellerDash() {
  const { scoped, today, nav, openDetail, brandName, productNames, client, me, promoterName } = useApp();
  const mk = monthKey(today);
  const month = scoped.filter((t) => monthKey(t.date) === mk && t.status !== 'CANCELADA');
  const upcoming = scoped.filter((t) => t.date >= today && isOpen(t.status)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const waiting = scoped.filter((t) => isPending(t.status));
  const done = scoped.filter((t) => t.status === 'FINALIZADA');
  const doneMonth = done.filter((t) => monthKey(t.date) === mk);
  const recent = [...done].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  return (
    <>
      <PageHeader
        title={`Olá, ${me.nome.split(' ')[0]} 👋`}
        subtitle={`${fmtLong(today)} · acompanhe suas degustações e solicite novas datas.`}
        actions={<Button variant="primary" size="lg" onClick={() => nav('novo')}><CalendarPlus size={18} /> AGENDAR DEGUSTAÇÃO</Button>}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Degustações este mês" value={month.length} hint="Outubro de 2026" icon={<CalendarCheck size={17} />} tone="navy" onClick={() => nav('agendamentos')} />
        <StatCard label="Próximas degustações" value={upcoming.length} hint="Agendadas a partir de hoje" icon={<CalendarClock size={17} />} tone="sky" onClick={() => nav('agendamentos')} />
        <StatCard label="Aguardando confirmação" value={waiting.length} hint="Em análise pela gestora" icon={<Hourglass size={17} />} tone="amber" onClick={() => nav('agendamentos', { status: 'pendentes' })} />
        <StatCard label="Finalizadas" value={doneMonth.length} hint="No mês atual" icon={<CheckCircle2 size={17} />} tone="emerald" onClick={() => nav('historico')} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Próximas degustações" subtitle="Ordenadas por data" action={<Button size="sm" variant="ghost" onClick={() => nav('agendamentos')}>Ver todas <ArrowRight size={14} /></Button>} />
          {upcoming.length === 0 ? (
            <EmptyState title="Nenhuma degustação futura" text="Solicite uma nova degustação para um cliente da sua carteira." action={<Button variant="primary" onClick={() => nav('novo')}>Agendar degustação</Button>} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.slice(0, 6).map((t) => (
                <li key={t.id}>
                  <button onClick={() => openDetail(t.id)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50">
                    <DateBlock iso={t.date} tone={t.date === today ? 'accent' : 'navy'} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{client(t.codcli)?.fantasia}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">Marca: {brandName(t)} · Produto: {productNames(t)[0]}{productNames(t).length > 1 ? ` +${productNames(t).length - 1}` : ''}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><Clock size={12} /> {t.start} às {t.end}{t.promotorId ? ` · ${promoterName(t.promotorId)}` : ''}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Finalizadas recentemente" subtitle="Resultados registrados pelos promotores" />
          {recent.length === 0 ? (
            <EmptyState title="Nenhuma degustação finalizada ainda" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((t) => (
                <li key={t.id}>
                  <button onClick={() => openDetail(t.id)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{client(t.codcli)?.fantasia}</span>
                      <span className="text-xs text-slate-500">{fmtBR(t.date)} · {brandName(t)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-bold tabular text-emerald-600">{t.attendees ?? '—'}</span>
                      <span className="text-[11px] text-slate-400">atendidos</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function ManagerDash() {
  const { tastings, today, nav, role, me } = useApp();
  const wkStart = startOfWeek(today);
  const wkEnd = addDays(wkStart, 6);
  const live = tastings.filter((t) => t.status !== 'CANCELADA');
  const hoje = live.filter((t) => t.date === today);
  const semana = live.filter((t) => t.date >= wkStart && t.date <= wkEnd);
  const aguardando = tastings.filter((t) => t.status === 'AGUARDANDO_PROMOTOR' || t.status === 'SOLICITADA');
  const conf = tastings.filter((t) => t.status === 'CONFIRMADA');
  const fin = tastings.filter((t) => t.status === 'FINALIZADA' && monthKey(t.date) === monthKey(today));
  const pending = tastings.filter((t) => isPending(t.status)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

  return (
    <>
      <PageHeader
        title={role === 'admin' ? 'Visão geral da operação' : `Olá, ${me.nome.split(' ')[0]} 👋`}
        subtitle={`${fmtLong(today)} · acompanhe solicitações e a agenda dos promotores.`}
        actions={<Button variant="secondary" onClick={() => nav('promotores')}><Users size={16} /> Agenda dos promotores</Button>}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Degustações hoje" value={hoje.length} hint={`${hoje.filter((t) => t.status === 'EM_ANDAMENTO').length} em andamento`} icon={<Sun size={17} />} tone="accent" onClick={() => nav('calendario')} />
        <StatCard label="Esta semana" value={semana.length} hint="Domingo a sábado" icon={<CalendarClock size={17} />} tone="navy" onClick={() => nav('calendario')} />
        <StatCard label="Aguardando promotor" value={aguardando.length} hint="Precisam de definição" icon={<Hourglass size={17} />} tone="amber" onClick={() => nav('agendamentos', { status: 'pendentes' })} />
        <StatCard label="Confirmadas" value={conf.length} hint="Promotor definido" icon={<CalendarCheck size={17} />} tone="sky" onClick={() => nav('agendamentos', { status: 'CONFIRMADA' })} />
        <div className="col-span-2 lg:col-span-1">
          <StatCard label="Finalizadas no mês" value={fin.length} hint={`${fin.reduce((n, t) => n + (t.attendees ?? 0), 0)} pessoas atendidas`} icon={<CheckCircle2 size={17} />} tone="emerald" onClick={() => nav('historico')} />
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Solicitações aguardando ação"
          subtitle={`${pending.length} ${pending.length === 1 ? 'solicitação' : 'solicitações'} em aberto`}
          action={<Button size="sm" variant="ghost" onClick={() => nav('agendamentos')}>Ver todas <ArrowRight size={14} /></Button>}
        />
        <TastingTable rows={pending.slice(0, 6)} empty="Todas as solicitações já foram atendidas." />
      </Card>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">Calendário de degustações</h2>
        <AgendaCalendar rows={tastings} compact />
      </div>
    </>
  );
}

function ActionCard({ t, d }: { t: Tasting; d: ReturnType<typeof useTastingDialogs> }) {
  const { client, brandName, productNames, typeName, openDetail, startAction, settings, today } = useApp();
  const c = client(t.codcli);
  const canStart = settings.allowStartAnyDate || t.date <= today;
  return (
    <Card className={t.status === 'EM_ANDAMENTO' ? 'border-accent-300 ring-1 ring-accent-200' : ''}>
      <div className="flex gap-4 p-5">
        <div className="w-[72px] shrink-0 text-center">
          <div className="text-2xl font-bold tabular leading-none">{t.start}</div>
          <div className="mt-1 text-xs text-slate-500">até {t.end}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">{c?.fantasia}</h3>
            <StatusBadge status={t.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">{brandName(t)} · {productNames(t).join(', ')}</p>
          <p className="text-sm text-slate-500">{typeName(t)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} /> {c?.cidade} · {c?.bairro}</p>
          {t.startedAt && t.status === 'EM_ANDAMENTO' && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-accent-50 px-2 py-1 text-xs font-semibold text-accent-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-500" /> Iniciado às {t.startedAt.slice(11, 16)}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        <Button size="sm" variant="secondary" onClick={() => openDetail(t.id)}>VER DETALHES</Button>
        <Button size="sm" variant="secondary" onClick={() => d.address(t.id)}><MapPin size={13} /> VER ENDEREÇO</Button>
        {t.status === 'CONFIRMADA' && <Button size="sm" variant="primary" disabled={!canStart} onClick={() => startAction(t.id)}><Play size={13} /> INICIAR AÇÃO</Button>}
        {t.status === 'EM_ANDAMENTO' && <Button size="sm" variant="success" onClick={() => d.finish(t.id)}><Square size={12} /> FINALIZAR AÇÃO</Button>}
      </div>
    </Card>
  );
}

function PromoterDash() {
  const { scoped, today, me } = useApp();
  const d = useTastingDialogs();
  const active = scoped.filter((t) => t.status !== 'CANCELADA');
  const hoje = active.filter((t) => t.date === today).sort((a, b) => a.start.localeCompare(b.start));
  const prox = active.filter((t) => t.date > today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const fin = scoped.filter((t) => t.status === 'FINALIZADA' && monthKey(t.date) === monthKey(today));
  return (
    <>
      <PageHeader title={`Olá, ${me.nome.split(' ')[0]} 👋`} subtitle={`${fmtLong(today)} · suas ações de degustação.`} />
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Ações hoje" value={hoje.length} icon={<Sun size={17} />} tone="accent" />
        <StatCard label="Próximas" value={prox.length} icon={<CalendarClock size={17} />} tone="sky" />
        <StatCard label="Finalizadas no mês" value={fin.length} icon={<CheckCircle2 size={17} />} tone="emerald" />
      </div>

      <h2 className="mb-3 mt-8 text-xs font-bold uppercase tracking-wider text-slate-500">Minhas ações · Hoje</h2>
      {hoje.length === 0 ? (
        <Card><EmptyState title="Nenhuma ação para hoje" text="Suas próximas degustações aparecem abaixo." /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">{hoje.map((t) => <ActionCard key={t.id} t={t} d={d} />)}</div>
      )}

      <h2 className="mb-3 mt-8 text-xs font-bold uppercase tracking-wider text-slate-500">Próximos dias</h2>
      {prox.length === 0 ? (
        <Card><EmptyState title="Nenhuma ação futura atribuída" /></Card>
      ) : (
        <div className="space-y-4">
          {prox.map((t) => (
            <div key={t.id}>
              <p className="mb-1.5 text-xs font-semibold text-slate-500">{fmtLong(t.date)}</p>
              <ActionCard t={t} d={d} />
            </div>
          ))}
        </div>
      )}
      {d.node}
    </>
  );
}
