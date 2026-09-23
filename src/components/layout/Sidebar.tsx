import { ChevronsUpDown, LifeBuoy, LogOut, Radio, UserCog } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/misc';
import { MenuItem, Popover } from '@/components/ui/overlay';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABEL } from '@/data/users';
import { cn } from '@/utils/cn';
import { Logo } from './Logo';
import { NAV_SECTIONS } from './navigation';

export function Sidebar({ counts, onNavigate }: { counts: { alerts: number; approvals: number }; onNavigate?: () => void }) {
  const { user, can, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 shrink-0 items-center border-b border-slate-100 px-4">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Menu principal">
        {NAV_SECTIONS.map((section, i) => {
          const items = section.items.filter((item) => can(item.permission));
          if (!items.length) return null;
          return (
            <div key={i} className={cn(i > 0 && 'mt-4')}>
              {section.title && <p className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">{section.title}</p>}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const count = item.badge ? counts[item.badge] : 0;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-sm font-medium transition-colors duration-150',
                            isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand-700' : 'text-slate-400 group-hover:text-slate-600')} />
                            <span className="flex-1 truncate">{item.label}</span>
                            {count > 0 && (
                              <span
                                className={cn(
                                  'min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums',
                                  item.badge === 'alerts' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700',
                                )}
                              >
                                {count}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-100 px-3 py-3">
        <NavLink
          to="/suporte"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn('flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-sm font-medium transition-colors', isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
          }
        >
          <LifeBuoy className="h-4 w-4 text-slate-400" /> Central de suporte
        </NavLink>
        <NavLink
          to="/status"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn('flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-sm font-medium transition-colors', isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
          }
        >
          <Radio className="h-4 w-4 text-slate-400" />
          <span className="flex-1">Status da plataforma</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500" title="Todos os sistemas operacionais" />
        </NavLink>

        {user && (
          <Popover
            align="start"
            className="bottom-full top-auto mb-1.5 w-[232px]"
            trigger={({ toggle }) => (
              <button onClick={toggle} className="mt-2 flex w-full items-center gap-2.5 rounded-md border border-slate-200 px-2.5 py-2 text-left transition-colors hover:bg-slate-50">
                <Avatar name={user.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-slate-900">{user.name}</span>
                  <span className="block truncate text-[11px] text-slate-500">{ROLE_LABEL[user.role]}</span>
                </span>
                <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            )}
          >
            {(close) => (
              <div className="p-1.5">
                <MenuItem
                  icon={<UserCog />}
                  onClick={() => {
                    close();
                    onNavigate?.();
                    navigate('/usuarios');
                  }}
                >
                  Meu perfil e permissões
                </MenuItem>
                <MenuItem
                  icon={<LogOut />}
                  danger
                  onClick={() => {
                    close();
                    logout();
                    navigate('/login');
                  }}
                >
                  Sair
                </MenuItem>
              </div>
            )}
          </Popover>
        )}
      </div>
    </div>
  );
}
