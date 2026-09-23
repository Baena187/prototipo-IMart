import { FileText, Image, Paperclip, ScrollText, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyValueList } from '@/components/shared/KeyValue';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/form';
import { Progress } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { db, TICKET_STATUS_FLOW, ticketsService } from '@/services';
import { TicketStatus, UserRole, type Ticket } from '@/types';
import { cn } from '@/utils/cn';
import { formatDateTime, formatDuration } from '@/utils/format';
import { TICKET_KIND, TICKET_PRIORITY, TICKET_STATUS } from '@/utils/labels';

export function slaInfo(t: Ticket) {
  const total = t.slaHours * 60;
  const elapsed = (Date.now() - new Date(t.openedAt).getTime()) / 60000;
  const remaining = total - elapsed;
  const pct = Math.min(100, (elapsed / total) * 100);
  const breached = remaining < 0 && t.status !== TicketStatus.Resolvido;
  return { remaining, pct, breached };
}

export function SlaIndicator({ ticket, compact }: { ticket: Ticket; compact?: boolean }) {
  if (ticket.status === TicketStatus.Resolvido) return <span className="text-xs text-emerald-700">Dentro do SLA</span>;
  const { remaining, pct, breached } = slaInfo(ticket);
  const tone = breached ? 'red' : pct > 75 ? 'amber' : 'green';
  return (
    <div className={cn(compact ? 'w-24' : 'w-full')}>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-500">SLA {ticket.slaHours}h</span>
        <span className={cn('font-medium tabular-nums', breached ? 'text-red-600' : pct > 75 ? 'text-amber-700' : 'text-slate-700')}>
          {breached ? `+${formatDuration(-remaining)}` : formatDuration(remaining)}
        </span>
      </div>
      <Progress value={pct} tone={tone} />
    </div>
  );
}

const ATTACH_ICON = { imagem: Image, pdf: FileText, log: ScrollText };

export function TicketSheet({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const toast = useToast();
  const { can } = useAuth();
  const [comment, setComment] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const manage = can('operations.manage');
  const store = db.stores.get(ticket.storeId);
  const techs = db.users.all().filter((u) => u.role === UserRole.Tecnico || u.role === UserRole.Suporte);

  return (
    <Sheet
      open
      width="lg"
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono text-slate-500">#{ticket.number}</span> {ticket.problem}
        </span>
      }
      description={
        <span className="flex flex-wrap items-center gap-2">
          <StatusBadge map={TICKET_STATUS} value={ticket.status} />
          <StatusBadge map={TICKET_PRIORITY} value={ticket.priority} dot={false} />
          <StatusBadge map={TICKET_KIND} value={ticket.kind} dot={false} />
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Status">
          <Select
            disabled={!manage}
            value={ticket.status}
            onChange={async (e) => {
              await ticketsService.updateStatus(ticket.id, e.target.value as TicketStatus);
              toast.success('Status atualizado', `${ticket.number} · ${TICKET_STATUS[e.target.value as TicketStatus].label}`);
            }}
          >
            {TICKET_STATUS_FLOW.map((s) => (
              <option key={s} value={s}>
                {TICKET_STATUS[s].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Técnico responsável">
          <Select
            disabled={!manage}
            value={ticket.technicianId ?? ''}
            onChange={async (e) => {
              if (!e.target.value) return;
              await ticketsService.assign(ticket.id, e.target.value);
              toast.success('Técnico atribuído', db.users.get(e.target.value)?.name);
            }}
          >
            <option value="">Não atribuído</option>
            {techs.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-5 rounded-md border border-slate-200 p-3">
        <SlaIndicator ticket={ticket} />
        <p className="mt-2 text-xs text-slate-500">
          Aberto em {formatDateTime(ticket.openedAt)} · prazo {formatDateTime(ticket.dueAt)}
        </p>
      </div>

      <div className="mt-5">
        <KeyValueList
          items={[
            { label: 'Cliente', value: ticket.client },
            { label: 'Loja', value: <Link className="text-brand-700 hover:underline" to={`/lojas/${ticket.storeId}`}>{store?.name}</Link> },
            { label: 'Equipamento', value: ticket.equipment },
            { label: 'Visita agendada', value: ticket.scheduledAt ? formatDateTime(ticket.scheduledAt) : '—' },
          ]}
        />
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500">Descrição do problema</p>
          <p className="mt-1 text-sm text-slate-800">{ticket.description}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-900">Anexos</p>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              await ticketsService.attach(ticket.id, f.name, Math.max(1, Math.round(f.size / 1024)));
              toast.success('Anexo adicionado', f.name);
              e.target.value = '';
            }}
          />
          <Button size="sm" variant="outline" disabled={!manage} onClick={() => fileRef.current?.click()}>
            <Upload /> Anexar
          </Button>
        </div>
        {ticket.attachments.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum anexo.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ticket.attachments.map((a) => {
              const Icon = ATTACH_ICON[a.kind] ?? Paperclip;
              return (
                <li key={a.id} className="flex items-center gap-2.5 rounded-md border border-slate-200 px-3 py-2">
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{a.name}</span>
                  <span className="text-xs text-slate-400">{a.sizeKb} KB</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-3 text-sm font-medium text-slate-900">Histórico</p>
        <Timeline
          items={[...ticket.history].reverse().map((h) => ({
            id: h.id,
            at: h.at,
            title: h.author,
            description: h.text,
            meta: h.status ? <StatusBadge map={TICKET_STATUS} value={h.status} dot={false} className="text-[11px]" /> : undefined,
          }))}
        />
        {manage && (
          <div className="mt-4 space-y-2">
            <Textarea rows={2} placeholder="Registrar atualização do atendimento…" value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                disabled={!comment.trim()}
                onClick={async () => {
                  await ticketsService.comment(ticket.id, comment.trim());
                  setComment('');
                  toast.success('Atualização registrada');
                }}
              >
                Registrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
