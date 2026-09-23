import { Bell, Check, ChevronDown, LogOut, Menu, Search, Store as StoreIcon, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Kbd } from '@/components/ui/misc';
import { MenuItem, Popover } from '@/components/ui/overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreScope } from '@/contexts/StoreScopeContext';
import { ROLE_LABEL, ROLES } from '@/data/users';
import { useQuery } from '@/hooks/useQuery';
import { notificationsService, storesService } from '@/services';
import { cn } from '@/utils/cn';
import { formatRelative } from '@/utils/format';

const toneDot = { info: 'bg-brand-600', warning: 'bg-amber-500', danger: 'bg-red-500', success: 'bg-emerald-500' };

export function Topbar({ onOpenSearch, onOpenMenu }: { onOpenSearch: () => void; onOpenMenu: () => void }) {
  const { user, logout, switchRole } = useAuth();
  const { storeId, setStoreId } = useStoreScope();
  const navigate = useNavigate();
  const { data: stores } = useQuery(() => Promise.resolve(storesService.listSync()), []);
  const { data: notifications } = useQuery(() => Promise.resolve(notificationsService.list()), []);
  const unread = notifications?.filter((n) => !n.read).length ?? 0;
  const selectedStore = stores?.find((s) => s.id === storeId);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:gap-3 sm:px-5">
      <button onClick={onOpenMenu} className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Abrir menu">
        <Menu className="h-5 w-5" />
      </button>

      <button
        onClick={onOpenSearch}
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 transition-colors hover:border-slate-300 hover:bg-white sm:max-w-md"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Pesquisar na plataforma…</span>
        <span className="ml-auto hidden sm:inline-flex">
          <Kbd>Ctrl K</Kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Popover
          align="end"
          className="w-[300px]"
          trigger={({ toggle, open }) => (
            <button
              onClick={toggle}
              className={cn(
                'flex h-9 items-center gap-2 rounded-md border px-2.5 text-sm transition-colors',
                open ? 'border-slate-300 bg-slate-50' : 'border-slate-200 hover:bg-slate-50',
                storeId && 'border-brand-200 bg-brand-50/50',
              )}
            >
              <StoreIcon className="h-4 w-4 text-slate-500" />
              <span className="hidden max-w-[180px] truncate font-medium text-slate-800 md:inline">{selectedStore ? selectedStore.name : 'Todas as lojas'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          )}
        >
          {(close) => (
            <div className="max-h-[360px] overflow-y-auto p-1.5">
              <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">Loja selecionada</p>
              {[{ id: '', name: 'Todas as lojas', code: `${stores?.length ?? 0} lojas` }, ...(stores ?? [])].map((s) => (
                <button
                  key={s.id || 'all'}
                  onClick={() => {
                    setStoreId(s.id || undefined);
                    close();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-slate-100"
                >
                  <span className="flex-1 truncate text-slate-800">{s.name}</span>
                  <span className="text-xs text-slate-400">{s.code}</span>
                  {(storeId ?? '') === s.id && <Check className="h-4 w-4 text-brand-700" />}
                </button>
              ))}
            </div>
          )}
        </Popover>

        <Popover
          align="end"
          className="w-[340px]"
          trigger={({ toggle }) => (
            <button onClick={toggle} className="relative rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100" aria-label="Notificações">
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </button>
          )}
        >
          {(close) => (
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Notificações</p>
                {unread > 0 && (
                  <button onClick={() => notificationsService.markAllRead()} className="text-xs font-medium text-brand-700 hover:underline">
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <ul className="max-h-[360px] overflow-y-auto py-1">
                {(notifications ?? []).slice(0, 10).map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        notificationsService.markRead(n.id);
                        close();
                        if (n.link) navigate(n.link);
                      }}
                      className="flex w-full gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-slate-200' : toneDot[n.tone])} />
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-sm', n.read ? 'text-slate-600' : 'font-medium text-slate-900')}>{n.title}</span>
                        <span className="block truncate text-xs text-slate-500">{n.description}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400">{formatRelative(n.at)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-100 p-1.5">
                <MenuItem
                  onClick={() => {
                    close();
                    navigate('/alertas');
                  }}
                >
                  Ver todos os alertas
                </MenuItem>
              </div>
            </div>
          )}
        </Popover>

        {user && (
          <Popover
            align="end"
            className="w-[260px]"
            trigger={({ toggle }) => (
              <button onClick={toggle} className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-slate-100" aria-label="Menu do usuário">
                <Avatar name={user.name} size="sm" className="h-7 w-7" />
                <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
              </button>
            )}
          >
            {(close) => (
              <div>
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="border-b border-slate-100 p-1.5">
                  <p className="px-2.5 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">Perfil de demonstração</p>
                  <div className="max-h-[220px] overflow-y-auto">
                    {ROLES.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          switchRole(r.role);
                          close();
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-slate-700 hover:bg-slate-100"
                      >
                        <span className="flex-1">{r.label}</span>
                        {user.role === r.role && <Check className="h-3.5 w-3.5 text-brand-700" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-1.5">
                  <MenuItem
                    icon={<UserCog />}
                    onClick={() => {
                      close();
                      navigate('/usuarios');
                    }}
                  >
                    Perfil: {ROLE_LABEL[user.role]}
                  </MenuItem>
                  <MenuItem
                    icon={<LogOut />}
                    danger
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                  >
                    Sair
                  </MenuItem>
                </div>
              </div>
            )}
          </Popover>
        )}
      </div>
    </header>
  );
}
