import type { AuditAction, AuditEvent } from '@/types';
import { uid } from '@/utils/time';
import { db } from './collections';
import { delay } from './db';
import { currentActor } from './session';

export interface AuditInput {
  action: AuditAction;
  summary: string;
  previousValue?: string;
  newValue?: string;
  storeId?: string;
  deviceRef?: string;
  system?: boolean;
}

export const auditService = {
  list: () => delay(db.audit.all()),

  log(input: AuditInput): AuditEvent {
    const actor = currentActor();
    const event: AuditEvent = {
      id: uid('au'),
      at: new Date().toISOString(),
      userId: input.system ? undefined : actor.id,
      userName: input.system ? 'Sistema' : actor.name,
      action: input.action,
      summary: input.summary,
      previousValue: input.previousValue,
      newValue: input.newValue,
      storeId: input.storeId,
      deviceRef: input.deviceRef,
      origin: input.system ? 'iMart Sync' : '177.84.12.40 · Web',
    };
    db.audit.upsert(event);
    return event;
  },
};
