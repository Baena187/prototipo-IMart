import { useState, type ReactNode } from 'react';
import { CheckCircle2, Clock, ExternalLink, MapPin, UserRound } from 'lucide-react';
import { useApp } from '../store';
import { promoterSlots } from '../lib/availability';
import { fmtBR } from '../lib/dates';
import { MOTIVOS_CANCELAMENTO } from '../data/catalog';
import { Badge, Button, cn, Avatar, Field, inputCls, Modal, textareaCls } from './ui';

type Kind = 'picker' | 'finish' | 'cancel' | 'address';

export function useTastingDialogs(): {
  node: ReactNode;
  pick: (id: string) => void;
  finish: (id: string) => void;
  cancel: (id: string) => void;
  address: (id: string) => void;
} {
  const [st, setSt] = useState<{ kind: Kind; id: string } | null>(null);
  const close = () => setSt(null);
  const node = st && (
    <>
      {st.kind === 'picker' && <PromoterPicker id={st.id} onClose={close} />}
      {st.kind === 'finish' && <FinishDialog id={st.id} onClose={close} />}
      {st.kind === 'cancel' && <CancelDialog id={st.id} onClose={close} />}
      {st.kind === 'address' && <AddressDialog id={st.id} onClose={close} />}
    </>
  );
  return {
    node,
    pick: (id) => setSt({ kind: 'picker', id }),
    finish: (id) => setSt({ kind: 'finish', id }),
    cancel: (id) => setSt({ kind: 'cancel', id }),
    address: (id) => setSt({ kind: 'address', id }),
  };
}

function PromoterPicker({ id, onClose }: { id: string; onClose: () => void }) {
  const { tastings, data, clientName, client, assignPromoter } = useApp();
  const t = tastings.find((x) => x.id === id)!;
  const [sel, setSel] = useState<string | null>(t.promotorId);
  const slots = promoterSlots(t, tastings, data.promoters, clientName);
  const cl = client(t.codcli);
  const chosen = slots.find((s) => s.promoter.id === sel);
  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Selecionar promotor"
      subtitle={`${clientName(t.codcli)} · ${fmtBR(t.date)} · ${t.start} às ${t.end}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={!chosen?.available} onClick={() => { assignPromoter(id, sel!, true); onClose(); }}>
            <CheckCircle2 size={16} /> CONFIRMAR PROMOTOR
          </Button>
        </>
      }
    >
      <ul className="space-y-2.5">
        {slots.map((s) => {
          const active = sel === s.promoter.id;
          const sameCity = cl && s.promoter.cidade === cl.cidade;
          return (
            <li
              key={s.promoter.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3.5 transition',
                active ? 'border-accent-500 bg-accent-50/50 ring-1 ring-accent-500' : 'border-slate-200',
                !s.available && 'bg-slate-50',
              )}
            >
              <Avatar name={s.promoter.nome} size={40} tone={s.available ? 'navy' : 'slate'} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={cn('text-sm font-semibold', !s.available && 'text-slate-500')}>{s.promoter.nome}</span>
                  <Badge className={s.available ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200'}>{s.label}</Badge>
                  {sameCity && s.available && <Badge className="bg-navy-50 text-navy-700 ring-navy-200">Mesma cidade</Badge>}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{s.detail}</p>
                <p className="text-xs text-slate-400">Base: {s.promoter.cidade} · {s.actionsDay} {s.actionsDay === 1 ? 'ação' : 'ações'} no dia</p>
              </div>
              <Button size="sm" variant={active ? 'dark' : 'secondary'} disabled={!s.available} onClick={() => setSel(s.promoter.id)}>
                {active ? 'Selecionado' : 'Selecionar'}
              </Button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

function FinishDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { tastings, clientName, finishAction } = useApp();
  const t = tastings.find((x) => x.id === id)!;
  const [note, setNote] = useState('');
  const [n, setN] = useState('');
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Finalizar degustação"
      subtitle={`${clientName(t.codcli)} · ${t.start} às ${t.end}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Voltar</Button>
          <Button variant="primary" onClick={() => { finishAction(id, note.trim(), Number(n) || 0); onClose(); }}>FINALIZAR</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Pessoas atendidas (opcional)">
          <input className={inputCls} type="number" min={0} inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} placeholder="Exemplo: 185" />
        </Field>
        <Field label="Observação final (opcional)">
          <textarea className={textareaCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Exemplo: Ação concluída normalmente." />
        </Field>
      </div>
    </Modal>
  );
}

function CancelDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { tastings, role, clientName, requestCancel, cancelTasting } = useApp();
  const t = tastings.find((x) => x.id === id)!;
  const direct = role === 'gestora' || role === 'admin';
  const [motivo, setMotivo] = useState(MOTIVOS_CANCELAMENTO[0]);
  const [obs, setObs] = useState('');
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={direct ? 'Cancelar agendamento' : 'Solicitar cancelamento'}
      subtitle={`${clientName(t.codcli)} · ${fmtBR(t.date)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Voltar</Button>
          <Button variant="danger" onClick={() => { direct ? cancelTasting(id, motivo) : requestCancel(id, motivo, obs); onClose(); }}>
            {direct ? 'CONFIRMAR CANCELAMENTO' : 'ENVIAR SOLICITAÇÃO'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <span className="mb-2 block text-xs font-semibold text-navy-700">Motivo</span>
          <div className="space-y-1.5">
            {MOTIVOS_CANCELAMENTO.map((m) => (
              <label key={m} className={cn('flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm', motivo === m ? 'border-accent-500 bg-accent-50/50' : 'border-slate-200 hover:bg-slate-50')}>
                <input type="radio" name="motivo" checked={motivo === m} onChange={() => setMotivo(m)} className="accent-accent-500" />
                {m}
              </label>
            ))}
          </div>
        </div>
        <Field label="Observação (opcional)">
          <textarea className={textareaCls} rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
        </Field>
        {!direct && <p className="text-xs text-slate-500">A gestora de promotores analisará e confirmará o cancelamento.</p>}
      </div>
    </Modal>
  );
}

function AddressDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { tastings, client } = useApp();
  const t = tastings.find((x) => x.id === id)!;
  const c = client(t.codcli)!;
  const full = `${c.endereco}, ${c.bairro}, ${c.cidade} - MT`;
  return (
    <Modal open onClose={onClose} size="sm" title="Endereço da ação" footer={<Button variant="ghost" onClick={onClose}>Fechar</Button>}>
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600"><MapPin size={20} /></span>
        <div>
          <p className="font-semibold">{c.fantasia}</p>
          <p className="mt-1 text-sm text-slate-600">{c.endereco}</p>
          <p className="text-sm text-slate-600">{c.bairro} · {c.cidade} - MT</p>
        </div>
      </div>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(full)}`}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
      >
        <ExternalLink size={15} /> Abrir no mapa
      </a>
    </Modal>
  );
}

export function PromoterChip({ name }: { name: string }) {
  const none = name === 'Não definido';
  return (
    <span className={cn('inline-flex items-center gap-1.5', none && 'text-slate-400')}>
      {none ? <Clock size={13} /> : <UserRound size={13} className="text-slate-400" />}
      {name}
    </span>
  );
}
