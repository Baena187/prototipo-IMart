import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { auditService, usersService } from '@/services';
import { getSession, setSession } from '@/services/session';
import { AuditAction, UserRole, type Permission, type SessionUser } from '@/types';
import { hasPermission } from '@/utils/permissions';

interface AuthContextValue {
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => getSession());

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 650));
    if (!email.includes('@') || password.length < 4) throw new Error('Verifique o e-mail e a senha informados.');
    const found = usersService.findByEmail(email);
    const session: SessionUser = found
      ? { id: found.id, name: found.name, email: found.email, role: found.role }
      : { id: 'u01', name: 'Daniel Souza', email, role: UserRole.AdminImart };
    setSession(session);
    setUser(session);
    auditService.log({ action: AuditAction.Login, summary: `${session.name} acessou a plataforma` });
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    setUser(null);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, role };
      setSession(next);
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, login, logout, switchRole, can: (p) => hasPermission(user?.role, p) }),
    [user, login, logout, switchRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}
