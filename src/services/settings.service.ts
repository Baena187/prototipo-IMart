import { AuditAction, type AppSettings } from '@/types';
import { auditService } from './audit.service';
import { db } from './collections';
import { delay, resetDemoData } from './db';
import { currentActor, firstName } from './session';

export const settingsService = {
  get: () => delay(db.settings.get(), 150),
  getSync: () => db.settings.get(),
  async update(changes: Partial<AppSettings>) {
    const before = db.settings.get();
    const after = db.settings.set(changes);
    const keys = Object.keys(changes) as (keyof AppSettings)[];
    const changed = keys.filter((k) => before[k] !== after[k]);
    if (changed.length) {
      auditService.log({
        action: AuditAction.Configuracao,
        summary: `${firstName(currentActor().name)} alterou configurações (${changed.length} campo${changed.length > 1 ? 's' : ''})`,
        previousValue: changed.map((k) => `${k}: ${String(before[k])}`).join(', '),
        newValue: changed.map((k) => `${k}: ${String(after[k])}`).join(', '),
      });
    }
    return delay(after, 300);
  },
  resetDemo() {
    resetDemoData();
    window.location.reload();
  },
};
