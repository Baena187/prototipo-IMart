import { UserRole, type SessionUser } from '@/types';

const KEY = 'imart.session';

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser | null) {
  try {
    if (user) localStorage.setItem(KEY, JSON.stringify(user));
    else localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Usuário responsável pelas ações registradas na auditoria. */
export function currentActor(): SessionUser {
  return getSession() ?? { id: 'u01', name: 'Daniel Souza', email: 'daniel.souza@imart.com.br', role: UserRole.AdminImart };
}

export function firstName(name: string) {
  return name.split(' ')[0];
}
