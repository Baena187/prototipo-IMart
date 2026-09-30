import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Bell, Building2, CalendarDays, CalendarPlus, CalendarRange, ChevronDown, History, LayoutDashboard, LogOut, Menu, Search, Settings, ShieldCheck, Store, Users, X,
} from 'lucide-react';
import type { Page, Role } from '../types';
import { useApp } from '../store';
import { ROLE_LABEL } from '../data/catalog';
import { fmtShort, fmtStamp } from '../lib/dates';
import { Avatar, cn, StatusBadge } from './ui';

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 text-white shadow-card">
        <CalendarDays size={19} strokeWidth={2.2} />
      </span>
      {!compact && (
        <div className="leading-none">
          <div className={cn('text-[15px] font-extrabold tracking-tight', light ? 'text-white' : 'text-navy-900')}>
            AGENDA<span className="text-accent-500">PROMO</span>
          </div>
          <div className={cn('mt-1 whitespace-nowrap text-[9.5px] font-medium uppercase tracking-[0.08em]', light ? 'text-navy-300' : 'text-slate-500')}>Degustações em clientes</div>
        </div>
      )}
    </div>
  );
}

const NAV: { page: Page; label: string; icon: ReactNode; roles: Role[] }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['vendedor', 'gestora', 'promotor', 'admin'] },
  { page: 'agendamentos', label: 'Agendamentos', icon: <CalendarRange size={18} />, roles: ['vendedor', 'gestora', 'admin'] },
  { page: 'calendario', label: 'Calendário', icon: <CalendarDays size={18} />, roles: ['vendedor', 'gestora', 'promotor', 'admin'] },
  { page: 'clientes', label: 'Clientes', icon: <Store size={18} />, roles: ['vendedor', 'gestora', 'admin'] },
  { page: 'promotores', label: 'Promotores', icon: <Users size={18} />, roles: ['gestora', 'admin'] },
  { page: 'historico', label: 'Histórico', icon: <History size={18} />, roles: ['vendedor', 'gestora', 'promotor', 'admin'] },
  { page: 'admin', label: 'Administração', icon: <ShieldCheck size={18} />, roles: ['admin'] },
  { page: 'configuracoes', label: 'Configurações', icon: <Settings size={18} />, roles: ['gestora', 'admin'] },
];

export const canAccess = (page: Page, role: Role) => page === 'novo' ? role === 'vendedor' || role === 'admin' || role === 'gestora' : NAV.find((n) => n.page === page)?.roles.includes(role) ?? false;

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role, page, nav, scoped, me } = useApp();
  const pending = scoped.filter((t) => t.status === 'AGUARDANDO_PROMOTOR' || t.status === 'SOLICITADA').length;
  const body = (
    <div className="flex h-full w-64 flex-col bg-navy-900 text-navy-200">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo light />
        <button className="text-navy-300 lg:hidden" onClick={onClose} aria-label="Fechar menu"><X size={20} /></button>
      </div>
      {(role === 'vendedor' || role === 'admin' || role === 'gestora') && (
        <div className="px-3 pb-2 pt-3">
          <button
            onClick={() => { nav('novo'); onClose(); }}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent-500 text-sm font-semibold text-white transition hover:bg-accent-600"
          >
            <CalendarPlus size={17} /> Agendar degustação
          </button>
        </div>
      )}
      <nav className="scroll-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV.filter((n) => n.roles.includes(role)).map((n) => {
          const active = page === n.page || (n.page === 'agendamentos' && page === 'novo');
          return (
            <button
              key={n.page}
              onClick={() => { nav(n.page); onClose(); }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                active ? 'bg-white/10 text-white' : 'text-navy-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <span className={active ? 'text-accent-400' : ''}>{n.icon}</span>
              {n.page === 'dashboard' && role === 'promotor' ? 'Minhas ações' : n.label}
              {n.page === 'agendamentos' && role === 'gestora' && pending > 0 && (
                <span className="ml-auto rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{pending}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="m-3 flex items-center gap-3 rounded-lg bg-white/5 p-3">
        <Avatar name={me.nome} tone="accent" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{me.nome}</div>
          <div className="truncate text-xs text-navy-300">{me.cargo}</div>
        </div>
      </div>
    </div>
  );
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden lg:block">{body}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-navy-950/50" onClick={onClose} />
          <div className="absolute inset-y-0 left-0 animate-slide-in-left">{body}</div>
        </div>
      )}
    </>
  );
}

function useOutside(ref: React.RefObject<HTMLElement>, fn: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && fn();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  });
}

function GlobalSearch() {
  const { tastings, data, clientName, brandName, openDetail, nav, scoped } = useApp();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  const term = q.trim().toLowerCase();
  const res = useMemo(() => {
    if (term.length < 2) return { t: [], c: [] };
    const ids = new Set(scoped.map((t) => t.id));
    const t = tastings
      .filter((x) => ids.has(x.id) && `${x.id} ${clientName(x.codcli)} ${brandName(x)}`.toLowerCase().includes(term))
      .slice(0, 4);
    const c = data.clients.filter((x) => `${x.codcli} ${x.fantasia} ${x.razao} ${x.cidade}`.toLowerCase().includes(term)).slice(0, 4);
    return { t, c };
  }, [term, tastings, data.clients, clientName, brandName, scoped]);
  return (
    <div ref={ref} className="relative hidden max-w-md flex-1 md:block">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar cliente, código ou degustação…"
        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20"
      />
      {open && term.length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-40 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-pop">
          {res.t.length === 0 && res.c.length === 0 && <p className="px-3 py-4 text-center text-sm text-slate-500">Nenhum resultado para “{q}”.</p>}
          {res.t.length > 0 && <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Degustações</div>}
          {res.t.map((t) => (
            <button key={t.id} onClick={() => { openDetail(t.id); setOpen(false); setQ(''); }} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{clientName(t.codcli)}</span>
                <span className="text-xs text-slate-500">{fmtShort(t.date)} · {brandName(t)} · {t.id}</span>
              </span>
              <StatusBadge status={t.status} />
            </button>
          ))}
          {res.c.length > 0 && <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Clientes</div>}
          {res.c.map((c) => (
            <button key={c.codcli} onClick={() => { nav('clientes', { q: c.codcli }); setOpen(false); setQ(''); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50">
              <Building2 size={16} className="text-slate-400" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{c.fantasia}</span>
                <span className="text-xs text-slate-500"><span className="font-mono">{c.codcli}</span> · {c.cidade}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Bell_() {
  const { myNotifications, markAllRead, markRead, openDetail, simulateNotification } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  const unread = myNotifications.filter((n) => !n.read).length;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-label="Notificações" className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
        <Bell size={19} />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="fixed left-3 right-3 top-16 z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold">Notificações</span>
            <button onClick={markAllRead} className="text-xs font-semibold text-accent-600 hover:underline">Marcar todas como lidas</button>
          </div>
          <div className="scroll-thin max-h-96 overflow-y-auto">
            {myNotifications.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">Nenhuma notificação.</p>}
            {myNotifications.map((n) => (
              <button
                key={n.id}
                onClick={() => { markRead(n.id); if (n.tastingId) { openDetail(n.tastingId); setOpen(false); } }}
                className={cn('flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50', !n.read && 'bg-accent-50/50')}
              >
                <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-slate-200' : 'bg-accent-500')} />
                <span>
                  <span className="block text-sm text-navy-900">{n.text}</span>
                  <span className="text-xs text-slate-500">{fmtStamp(n.at)}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
            <button onClick={simulateNotification} className="text-xs font-semibold text-navy-700 hover:underline">+ Simular nova notificação</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { role, setRole, me, logout } = useApp();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setMenu(false));
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Abrir menu"><Menu size={20} /></button>
      <div className="lg:hidden"><Logo compact /></div>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-xs text-slate-500">
          <span className="hidden font-medium sm:inline">Visualizar como</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="h-8 rounded-md border-0 bg-white py-0 pl-2 pr-7 text-xs font-semibold text-navy-900 shadow-card focus:outline-none focus:ring-2 focus:ring-accent-500/30"
            aria-label="Visualizar como"
          >
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </label>
        <Bell_ />
        <div ref={ref} className="relative">
          <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100">
            <Avatar name={me.nome} tone="navy" />
            <div className="hidden text-left leading-tight md:block">
              <div className="text-sm font-semibold">{me.nome}</div>
              <div className="text-[11px] text-slate-500">{me.cargo}</div>
            </div>
            <ChevronDown size={15} className="hidden text-slate-400 md:block" />
          </button>
          {menu && (
            <div className="absolute right-0 top-12 z-40 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop">
              <div className="border-b border-slate-100 px-3 py-2">
                <div className="text-sm font-semibold">{me.nome}</div>
                <div className="truncate text-xs text-slate-500">{me.email}</div>
              </div>
              <button onClick={logout} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <LogOut size={16} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
