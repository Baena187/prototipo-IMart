import { AuditAction, TicketPriority, TicketStatus, type Ticket, type TicketKind } from '@/types';
import { uid } from '@/utils/time';
import { CLIENT_NAME } from '@/data/stores';
import { auditService } from './audit.service';
import { db } from './collections';
import { delay } from './db';
import { currentActor, firstName } from './session';

export const TICKET_STATUS_FLOW: TicketStatus[] = [
  TicketStatus.Aberto,
  TicketStatus.EmDiagnostico,
  TicketStatus.AtendimentoRemoto,
  TicketStatus.VisitaAgendada,
  TicketStatus.EmAtendimento,
  TicketStatus.Resolvido,
];

export const SLA_BY_PRIORITY: Record<TicketPriority, number> = {
  [TicketPriority.Critica]: 2,
  [TicketPriority.Alta]: 4,
  [TicketPriority.Media]: 8,
  [TicketPriority.Baixa]: 24,
};

export interface TicketInput {
  kind: TicketKind;
  storeId: string;
  equipment: string;
  problem: string;
  description: string;
  priority: TicketPriority;
  technicianId?: string;
}

export const ticketsService = {
  list: () => delay(db.tickets.all().slice().sort((a, b) => b.number.localeCompare(a.number))),

  async create(input: TicketInput): Promise<Ticket> {
    const actor = currentActor();
    const max = Math.max(...db.tickets.all().map((t) => Number(t.number.split('-')[1])));
    const number = max + 1;
    const now = new Date();
    const sla = SLA_BY_PRIORITY[input.priority];
    const ticket: Ticket = {
      id: `im-${number}`,
      number: `IM-${number}`,
      client: CLIENT_NAME,
      ...input,
      slaHours: sla,
      openedAt: now.toISOString(),
      dueAt: new Date(now.getTime() + sla * 3_600_000).toISOString(),
      status: TicketStatus.Aberto,
      history: [{ id: uid('h'), at: now.toISOString(), author: actor.name, text: 'Chamado aberto.', status: TicketStatus.Aberto }],
      attachments: [],
    };
    db.tickets.upsert(ticket);
    auditService.log({ action: AuditAction.Chamado, summary: `${firstName(actor.name)} abriu o chamado ${ticket.number}`, newValue: input.problem, storeId: input.storeId });
    return delay(ticket, 350);
  },

  async updateStatus(id: string, status: TicketStatus, note?: string, scheduledAt?: string) {
    const actor = currentActor();
    const t = db.tickets.get(id);
    if (!t) return;
    const labels: Record<TicketStatus, string> = {
      aberto: 'Aberto', em_diagnostico: 'Em diagnóstico', atendimento_remoto: 'Atendimento remoto',
      visita_agendada: 'Visita agendada', em_atendimento: 'Em atendimento', resolvido: 'Resolvido',
    };
    db.tickets.upsert({
      ...t,
      status,
      scheduledAt: scheduledAt ?? t.scheduledAt,
      history: [...t.history, { id: uid('h'), at: new Date().toISOString(), author: actor.name, text: note || `Status alterado para ${labels[status]}.`, status }],
    });
    auditService.log({ action: AuditAction.Chamado, summary: `${firstName(actor.name)} atualizou o chamado ${t.number}`, previousValue: labels[t.status], newValue: labels[status], storeId: t.storeId });
    return delay(true, 250);
  },

  async assign(id: string, technicianId: string) {
    const t = db.tickets.get(id);
    const tech = db.users.get(technicianId);
    if (!t || !tech) return;
    db.tickets.upsert({
      ...t,
      technicianId,
      history: [...t.history, { id: uid('h'), at: new Date().toISOString(), author: currentActor().name, text: `Técnico responsável: ${tech.name}.` }],
    });
    return delay(true, 200);
  },

  async comment(id: string, text: string) {
    const t = db.tickets.get(id);
    if (!t) return;
    db.tickets.upsert({ ...t, history: [...t.history, { id: uid('h'), at: new Date().toISOString(), author: currentActor().name, text }] });
    return delay(true, 200);
  },

  async attach(id: string, name: string, sizeKb: number) {
    const t = db.tickets.get(id);
    if (!t) return;
    const kind = /\.(png|jpe?g|webp)$/i.test(name) ? 'imagem' : /\.pdf$/i.test(name) ? 'pdf' : 'log';
    db.tickets.upsert({ ...t, attachments: [...t.attachments, { id: uid('a'), name, sizeKb, kind }] });
    return delay(true, 300);
  },
};
