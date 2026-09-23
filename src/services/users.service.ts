import { ROLES } from '@/data/users';
import { AuditAction, UserStatus, type User, type UserRole } from '@/types';
import { uid } from '@/utils/time';
import { auditService } from './audit.service';
import { db } from './collections';
import { delay } from './db';
import { currentActor, firstName } from './session';

export const usersService = {
  list: () => delay(db.users.all()),
  listSync: () => db.users.all(),
  roles: () => ROLES,
  findByEmail: (email: string) => db.users.all().find((u) => u.email.toLowerCase() === email.trim().toLowerCase()),

  async invite(input: { name: string; email: string; role: UserRole; storeIds: string[] | 'all' }) {
    const user: User = { id: uid('u'), ...input, status: UserStatus.Convidado, organization: 'iMart Supermercado' };
    db.users.upsert(user);
    auditService.log({ action: AuditAction.Usuario, summary: `${firstName(currentActor().name)} convidou ${input.name}`, newValue: 'Convidado' });
    return delay(user, 350);
  },

  async update(id: string, changes: Partial<User>) {
    const before = db.users.get(id);
    const user = db.users.update(id, changes);
    if (before && user) {
      auditService.log({
        action: AuditAction.Usuario,
        summary: `${firstName(currentActor().name)} atualizou o usuário ${user.name}`,
        previousValue: changes.role ? before.role : changes.status ? before.status : undefined,
        newValue: changes.role ?? changes.status,
      });
    }
    return delay(user, 250);
  },
};
