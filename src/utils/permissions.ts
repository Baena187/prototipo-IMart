import { ROLES } from '@/data/users';
import type { Permission, UserRole } from '@/types';

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLES.find((r) => r.role === role)?.permissions.includes(permission) ?? false;
}
