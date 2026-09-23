import { AlertStatus, AuditAction, type Alert } from '@/types';
import { uid } from '@/utils/time';
import { auditService } from './audit.service';
import { db } from './collections';
import { delay } from './db';
import { currentActor, firstName } from './session';

const STATUS_LABEL: Record<AlertStatus, string> = {
  [AlertStatus.Aberto]: 'Aberto',
  [AlertStatus.Reconhecido]: 'Reconhecido',
  [AlertStatus.Resolvido]: 'Resolvido',
};

function transition(ids: string[], status: AlertStatus) {
  const actor = currentActor();
  const now = new Date().toISOString();
  ids.forEach((id) => {
    const a = db.alerts.get(id);
    if (!a || a.status === status) return;
    const patch: Partial<Alert> = { status };
    if (status === AlertStatus.Reconhecido) patch.acknowledgedAt = now;
    if (status === AlertStatus.Resolvido) patch.resolvedAt = now;
    if (!a.assigneeId) patch.assigneeId = actor.id;
    db.alerts.upsert({ ...a, ...patch });
    auditService.log({
      action: AuditAction.Alerta,
      summary: `${firstName(actor.name)} ${status === AlertStatus.Resolvido ? 'resolveu' : 'reconheceu'} o alerta "${a.title}"`,
      previousValue: STATUS_LABEL[a.status],
      newValue: STATUS_LABEL[status],
      storeId: a.storeId,
      deviceRef: a.deviceRef,
    });
  });
}

export const alertsService = {
  list: () => delay(db.alerts.all().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  acknowledge: async (ids: string[]) => {
    transition(ids, AlertStatus.Reconhecido);
    return delay(true, 250);
  },
  resolve: async (ids: string[]) => {
    transition(ids, AlertStatus.Resolvido);
    return delay(true, 250);
  },
  async assign(id: string, userId: string) {
    const a = db.alerts.get(id);
    const user = db.users.get(userId);
    if (!a || !user) return;
    db.alerts.upsert({ ...a, assigneeId: userId });
    auditService.log({ action: AuditAction.Alerta, summary: `${firstName(currentActor().name)} atribuiu o alerta "${a.title}" a ${user.name}`, storeId: a.storeId });
    return delay(true, 200);
  },
  async addNote(id: string, text: string) {
    const a = db.alerts.get(id);
    if (!a) return;
    const actor = currentActor();
    db.alerts.upsert({ ...a, notes: [...a.notes, { id: uid('n'), author: actor.name, text, createdAt: new Date().toISOString() }] });
    return delay(true, 200);
  },
};
