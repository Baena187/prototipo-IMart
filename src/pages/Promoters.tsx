import { useState } from 'react';
import { CalendarClock, Clock, MapPin, Phone } from 'lucide-react';
import type { Promoter } from '../types';
import { useApp } from '../store';
import { absentIds } from '../lib/availability';
import { DIAS_CURTO, addDays, dayNum, fmtLong, monthShort, weekday } from '../lib/dates';
import { Avatar, Badge, Card, EmptyState, Modal, PageHeader, StatusBadge, Button } from '../components/ui';

function useSituation() {
  const { tastings, today, data } = useApp();
  const away = absentIds(today, data.promoters).ids;
  return (p: Promoter) => {
    const mine = tastings.filter((t) => t.promotorId === p.id && t.date === today && t.status !== 'CANCELADA').sort((a, b) => a.start.localeCompare(b.start));
    const emAtendimento = mine.find((t) => t.status === 'EM_ANDAMENTO');
    const next = mine.find((t) => t.status === 'CONFIRMADA' || t.status === 'PROMOTOR_DEFINIDO');
    let label = 'Disponível';
    let tone = 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    if (away.has(p.id)) { label = 'Folga'; tone = 'bg-slate-100 text-slate-600 ring-slate-200'; }
    else if (emAtendimento) { label = 'Em atendimento'; tone = 'bg-accent-50 text-accent-700 ring-accent-200'; }
    else if (mine.length && !next) { label = 'Ações concluídas'; tone = 'bg-sky-50 text-sky-700 ring-sky-200'; }
    return { mine, next: emAtendimento ?? next, label, tone };
  };
}

export function PromotersPage() {
  const { data, clientName } = useApp();
  const sit = useSituation();
  const [open, setOpen] = useState<Promoter | null>(null);
  return (
    <>
      <PageHeader title="Promotores" subtitle="Situação e agenda de cada promotor de merchandising." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.promoters.filter((p) => p.ativo).map((p) => {
          const s = sit(p);
          return (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar name={p.nome} size={44} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{p.nome}</h3>
                  <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} /> Base em {p.cidade}</p>
                </div>
                <Badge className={s.tone}>{s.label}</Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Hoje</dt><dd className="font-semibold">{s.mine.length} {s.mine.length === 1 ? 'ação' : 'ações'}</dd></div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.label === 'Em atendimento' ? 'Em curso' : 'Próxima'}</dt>
                  <dd className="truncate font-semibold">{s.next ? `${s.next.start} · ${clientName(s.next.codcli)}` : '—'}</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-slate-500"><Phone size={12} /> {p.telefone}</span>
                <Button size="sm" variant="secondary" onClick={() => setOpen(p)}><CalendarClock size={14} /> Ver agenda</Button>
              </div>
            </Card>
          );
        })}
      </div>
      {open && <AgendaDialog p={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function AgendaDialog({ p, onClose }: { p: Promoter; onClose: () => void }) {
  const { tastings, today, data, openDetail, clientName, brandName } = useApp();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  return (
    <Modal open onClose={onClose} size="lg" title={`Agenda de ${p.nome}`} subtitle="Próximos 7 dias">
      <div className="space-y-4">
        {days.map((d) => {
          const list = tastings.filter((t) => t.promotorId === p.id && t.date === d && t.status !== 'CANCELADA').sort((a, b) => a.start.localeCompare(b.start));
          const off = absentIds(d, data.promoters).ids.has(p.id);
          return (
            <div key={d} className="flex gap-4">
              <div className="w-14 shrink-0 text-center">
                <div className="text-[11px] font-semibold uppercase text-slate-400">{DIAS_CURTO[weekday(d)]}</div>
                <div className="text-xl font-bold leading-tight">{dayNum(d)}</div>
                <div className="text-[10px] font-semibold text-slate-400">{monthShort(d)}</div>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {off && <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">Folga / ausência programada</div>}
                {list.length === 0 && !off && <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400" title={fmtLong(d)}>Sem ações — disponível</div>}
                {list.map((t) => (
                  <button key={t.id} onClick={() => openDetail(t.id)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-left hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Clock size={12} />{t.start} – {t.end}</span>
                      <span className="block truncate text-sm font-semibold">{clientName(t.codcli)}</span>
                      <span className="text-xs text-slate-500">{brandName(t)}</span>
                    </span>
                    <StatusBadge status={t.status} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {days.length === 0 && <EmptyState title="Sem dados" />}
      </div>
    </Modal>
  );
}
