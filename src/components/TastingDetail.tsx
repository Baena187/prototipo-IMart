import { AlertTriangle, CheckCircle2, MapPin, Play, Square, UserPlus, Ban } from 'lucide-react';
import { useApp } from '../store';
import { STATUS_LABEL, STATUS_ORDER, isOpen } from '../lib/status';
import { fmtBR, fmtLong, fmtStamp } from '../lib/dates';
import type { Status } from '../types';
import { Badge, Button, KV, Modal, StatusBadge } from './ui';
import { useTastingDialogs } from './TastingActions';

export function TastingDetail() {
  const a = useApp();
  const { detailId, openDetail, tastings, role, client, sellerName, promoterName, brandName, productNames, typeName, settings, today } = a;
  const d = useTastingDialogs();
  const t = tastings.find((x) => x.id === detailId);
  if (!t) return null;
  const c = client(t.codcli);
  const manager = role === 'gestora' || role === 'admin';
  const pending = t.status === 'SOLICITADA' || t.status === 'AGUARDANDO_PROMOTOR';
  const canStartToday = settings.allowStartAnyDate || t.date <= today;

  const footer = (
    <>
      {manager && t.cancelRequest && (
        <>
          <Button variant="secondary" onClick={() => a.rejectCancel(t.id)}>Recusar</Button>
          <Button variant="danger" onClick={() => { a.confirmCancel(t.id); }}><Ban size={15} /> CONFIRMAR CANCELAMENTO</Button>
        </>
      )}
      {manager && !t.cancelRequest && isOpen(t.status) && t.status !== 'EM_ANDAMENTO' && (
        <Button variant="ghost" className="mr-auto text-rose-600 hover:bg-rose-50" onClick={() => d.cancel(t.id)}>Cancelar agendamento</Button>
      )}
      {manager && pending && <Button variant="primary" onClick={() => d.pick(t.id)}><UserPlus size={16} /> DEFINIR PROMOTOR</Button>}
      {manager && t.status === 'PROMOTOR_DEFINIDO' && (
        <>
          <Button variant="secondary" onClick={() => d.pick(t.id)}>Trocar promotor</Button>
          <Button variant="primary" onClick={() => a.confirmPromoter(t.id)}><CheckCircle2 size={16} /> CONFIRMAR PROMOTOR</Button>
        </>
      )}
      {manager && t.status === 'CONFIRMADA' && <Button variant="secondary" onClick={() => d.pick(t.id)}>Trocar promotor</Button>}
      {role === 'vendedor' && isOpen(t.status) && t.status !== 'EM_ANDAMENTO' && !t.cancelRequest && (
        <Button variant="secondary" className="text-rose-600" onClick={() => d.cancel(t.id)}>Solicitar cancelamento</Button>
      )}
      {role === 'promotor' && (
        <>
          <Button variant="secondary" onClick={() => d.address(t.id)}><MapPin size={15} /> VER ENDEREÇO</Button>
          {t.status === 'CONFIRMADA' && <Button variant="primary" disabled={!canStartToday} onClick={() => a.startAction(t.id)}><Play size={15} /> INICIAR AÇÃO</Button>}
          {t.status === 'EM_ANDAMENTO' && <Button variant="success" onClick={() => d.finish(t.id)}><Square size={14} /> FINALIZAR AÇÃO</Button>}
        </>
      )}
      <Button variant="ghost" onClick={() => openDetail(null)}>Fechar</Button>
    </>
  );

  return (
    <>
      <Modal
        open
        onClose={() => openDetail(null)}
        size="lg"
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {c?.fantasia ?? t.codcli}
          </span>
        }
        subtitle={`Degustação ${t.id} · solicitada em ${fmtStamp(t.createdAt)}`}
        footer={footer}
      >
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <StatusBadge status={t.status} />
          {t.cancelRequest && <Badge className="bg-rose-50 text-rose-700 ring-rose-200">CANCELAMENTO SOLICITADO</Badge>}
        </div>

        {t.cancelRequest && (
          <div className="mb-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Cancelamento solicitado por {t.cancelRequest.by}</p>
              <p>Motivo: {t.cancelRequest.motivo}{t.cancelRequest.obs ? ` — ${t.cancelRequest.obs}` : ''}</p>
              {!manager && <p className="mt-1 text-xs text-rose-700">Aguardando confirmação da gestora de promotores.</p>}
            </div>
          </div>
        )}
        {t.status === 'CANCELADA' && t.cancelReason && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Motivo do cancelamento: <b>{t.cancelReason}</b></div>
        )}

        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <KV label="Cliente">{c?.fantasia} <span className="font-mono text-xs text-slate-400">CODCLI {t.codcli}</span></KV>
          <KV label="Cidade / endereço">{c?.cidade} — {c?.endereco}</KV>
          <KV label="Data">{fmtLong(t.date)}</KV>
          <KV label="Horário">{t.start} às {t.end}</KV>
          <KV label="Vendedor">{sellerName(t.vendedorId)}</KV>
          <KV label="Promotor">{promoterName(t.promotorId)}</KV>
          <KV label="Marca">{brandName(t)}</KV>
          <KV label="Tipo de ação">{typeName(t)}</KV>
          <div className="sm:col-span-2"><KV label="Produtos">{productNames(t).join(' · ') || '—'}</KV></div>
          <div className="sm:col-span-2">
            <KV label="Materiais">
              {t.materiais.length ? <span className="mt-1 flex flex-wrap gap-1.5">{t.materiais.map((m) => <span key={m} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{m}</span>)}</span> : '—'}
            </KV>
          </div>
          <div className="sm:col-span-2"><KV label="Observações">{t.obs || 'Sem observações.'}</KV></div>
        </dl>

        {(t.startedAt || t.finishedAt) && (
          <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-4">
            <KV label="Iniciado às">{t.startedAt ? t.startedAt.slice(11, 16) : '—'}</KV>
            <KV label="Finalizado às">{t.finishedAt ? t.finishedAt.slice(11, 16) : '—'}</KV>
            <KV label="Pessoas atendidas">{t.attendees ?? '—'}</KV>
            <KV label="Observação final">{t.finalNote ?? '—'}</KV>
          </div>
        )}

        <h4 className="mb-3 mt-7 text-xs font-semibold uppercase tracking-wide text-slate-400">Histórico do agendamento</h4>
        <ol className="space-y-3 border-l border-slate-200 pl-4">
          {[...t.events].reverse().map((e, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-accent-500 ring-4 ring-white" />
              <p className="text-sm font-medium">{e.text}</p>
              <p className="text-xs text-slate-500">{fmtStamp(e.at)} · {e.by}</p>
            </li>
          ))}
        </ol>

        {manager && isOpen(t.status) && (
          <div className="mt-7 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3">
            <span className="text-xs font-semibold text-navy-700">Alterar status</span>
            <select
              value={t.status}
              onChange={(e) => a.setStatus(t.id, e.target.value as Status)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium focus:border-accent-500 focus:outline-none"
            >
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <span className="text-xs text-slate-400">Uso manual pela gestão · {fmtBR(t.date)}</span>
          </div>
        )}
      </Modal>
      {d.node}
    </>
  );
}

