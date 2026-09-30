import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ActionType, AppUser, Brand, Client, Notification, Page, Product, Promoter, Role, Seller, Settings, Status, Tasting } from './types';
import { ACTION_TYPES, BRANDS, CLIENTS, DEMO_IDENTITY, OUTRA, PRODUCTS, PROMOTERS, SELLERS, USERS } from './data/catalog';
import { SEED_NOTIFICATIONS, SEED_SETTINGS, SEED_TASTINGS } from './data/seed';

const KEY = 'agendapromo:v2';

export interface Data {
  clients: Client[];
  sellers: Seller[];
  promoters: Promoter[];
  users: AppUser[];
  brands: Brand[];
  products: Product[];
  types: ActionType[];
}
export type DataKey = keyof Data;

interface Persisted {
  data: Data;
  tastings: Tasting[];
  notifications: Notification[];
  settings: Settings;
  session: { logged: boolean; role: Role };
  page: Page;
  navParams: NavParams;
}
export interface NavParams { status?: string; q?: string; scope?: string }

const seed = (): Persisted => ({
  data: { clients: CLIENTS, sellers: SELLERS, promoters: PROMOTERS, users: USERS, brands: BRANDS, products: PRODUCTS, types: ACTION_TYPES },
  tastings: SEED_TASTINGS,
  notifications: SEED_NOTIFICATIONS,
  settings: SEED_SETTINGS,
  session: { logged: false, role: 'vendedor' },
  page: 'dashboard',
  navParams: {},
});

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seed(), ...JSON.parse(raw) };
  } catch {
    /* localStorage indisponível */
  }
  return seed();
}

export interface Toast { id: number; text: string; kind: 'ok' | 'info' | 'warn' }

export interface NewTasting {
  codcli: string; date: string; start: string; end: string; tipoId: string; tipoOutro?: string; brandId: string;
  marcaOutra?: string; productIds: string[]; produtoOutro?: string; materiais: string[]; obs: string;
}

interface Ctx extends Persisted {
  role: Role;
  me: { id: string; nome: string; cargo: string; email: string };
  today: string;
  toasts: Toast[];
  detailId: string | null;
  openDetail: (id: string | null) => void;
  nav: (p: Page, params?: NavParams) => void;
  login: (role: Role) => void;
  logout: () => void;
  setRole: (r: Role) => void;
  // consultas
  client: (codcli: string) => Client | undefined;
  clientName: (codcli: string) => string;
  sellerName: (id: string) => string;
  promoterName: (id: string | null) => string;
  brandName: (t: Tasting) => string;
  productNames: (t: Tasting) => string[];
  typeName: (t: Tasting) => string;
  scoped: Tasting[];
  myNotifications: Notification[];
  // ações
  createTasting: (n: NewTasting) => Tasting;
  assignPromoter: (id: string, promoterId: string, confirm: boolean) => void;
  confirmPromoter: (id: string) => void;
  setStatus: (id: string, s: Status) => void;
  startAction: (id: string) => void;
  finishAction: (id: string, note: string, attendees: number) => void;
  requestCancel: (id: string, motivo: string, obs: string) => void;
  cancelTasting: (id: string, motivo: string) => void;
  confirmCancel: (id: string) => void;
  rejectCancel: (id: string) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  simulateNotification: () => void;
  updateSettings: (p: Partial<Settings>) => void;
  setList: <K extends DataKey>(k: K, fn: (l: Data[K]) => Data[K]) => void;
  toast: (text: string, kind?: Toast['kind']) => void;
  resetDemo: () => void;
}

const C = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(C);

const pad = (n: number) => String(n).padStart(2, '0');

export function AppProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<Persisted>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch {
      /* ignora */
    }
  }, [st]);

  const role = st.session.role;
  const me = DEMO_IDENTITY[role];
  const today = st.settings.refDate;
  const stamp = useCallback(() => {
    const d = new Date();
    return `${st.settings.refDate}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, [st.settings.refDate]);

  const toast = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const d = st.data;
  const client = useCallback((c: string) => d.clients.find((x) => x.codcli === c), [d.clients]);
  const clientName = useCallback((c: string) => client(c)?.fantasia ?? c, [client]);
  const sellerName = useCallback((id: string) => d.sellers.find((s) => s.id === id)?.nome ?? '—', [d.sellers]);
  const promoterName = useCallback((id: string | null) => (id ? d.promoters.find((p) => p.id === id)?.nome ?? '—' : 'Não definido'), [d.promoters]);
  const brandName = useCallback((t: Tasting) => (t.brandId === OUTRA ? t.marcaOutra || 'Outra' : d.brands.find((b) => b.id === t.brandId)?.nome ?? '—'), [d.brands]);
  const productNames = useCallback(
    (t: Tasting) => {
      const n = t.productIds.map((id) => d.products.find((p) => p.id === id)?.nome ?? id);
      if (t.produtoOutro) n.push(t.produtoOutro);
      return n;
    },
    [d.products],
  );
  const typeName = useCallback(
    (t: Tasting) => {
      const n = d.types.find((x) => x.id === t.tipoId)?.nome ?? '—';
      return t.tipoId === 'outro' && t.tipoOutro ? `Outro — ${t.tipoOutro}` : n;
    },
    [d.types],
  );

  const scoped = useMemo(() => {
    if (role === 'vendedor') return st.tastings.filter((t) => t.vendedorId === me.id);
    if (role === 'promotor') return st.tastings.filter((t) => t.promotorId === me.id);
    return st.tastings;
  }, [st.tastings, role, me.id]);

  const myNotifications = useMemo(
    () => st.notifications.filter((n) => n.role === role && (!n.userId || n.userId === me.id)).sort((a, b) => b.at.localeCompare(a.at)),
    [st.notifications, role, me.id],
  );

  // ---------- helpers de mutação ----------
  const mutate = (fn: (s: Persisted) => Persisted) => setSt(fn);
  const notif = (s: Persisted, n: Omit<Notification, 'id' | 'at' | 'read'>): Notification[] => [
    { ...n, id: `n${Date.now()}${Math.floor(Math.random() * 1000)}`, at: stamp(), read: false },
    ...s.notifications,
  ];
  const patch = (s: Persisted, id: string, fn: (t: Tasting) => Tasting): Tasting[] => s.tastings.map((t) => (t.id === id ? fn(t) : t));
  const ev = (t: Tasting, text: string, by: string): Tasting => ({ ...t, events: [...t.events, { at: stamp(), text, by }] });
  const shortDate = (t: Tasting) => `${t.date.slice(8, 10)}/${t.date.slice(5, 7)}`;
  const find = (id: string) => st.tastings.find((t) => t.id === id)!;

  const actions = {
    createTasting(n: NewTasting): Tasting {
      const num = Math.max(1000, ...st.tastings.map((t) => Number(t.id.slice(3)))) + 1;
      const cl = client(n.codcli)!;
      const t: Tasting = {
        ...n,
        id: `DG-${num}`,
        vendedorId: role === 'vendedor' ? me.id : cl.vendedorId,
        promotorId: null,
        status: 'AGUARDANDO_PROMOTOR',
        createdAt: stamp(),
        cancelRequest: null,
        events: [
          { at: stamp(), text: 'Solicitação de degustação criada', by: me.nome },
          { at: stamp(), text: 'Enviada para análise da gestora de promotores', by: 'Sistema' },
        ],
      };
      mutate((s) => ({
        ...s,
        tastings: [...s.tastings, t],
        notifications: notif(s, { role: 'gestora', text: 'Nova solicitação de degustação recebida.', tastingId: t.id }),
      }));
      toast('Gestora de promotores notificada', 'info');
      return t;
    },
    assignPromoter(id: string, promoterId: string, confirm: boolean) {
      const t = find(id);
      const nome = promoterName(promoterId);
      const status: Status = confirm ? 'CONFIRMADA' : 'PROMOTOR_DEFINIDO';
      mutate((s) => {
        let notifs = s.notifications;
        const add = (n: Omit<Notification, 'id' | 'at' | 'read'>) => {
          notifs = notif({ ...s, notifications: notifs }, n);
        };
        add({ role: 'promotor', userId: promoterId, text: `Nova degustação atribuída para ${shortDate(t)} às ${t.start}.`, tastingId: id });
        add({ role: 'vendedor', userId: t.vendedorId, text: `Promotor ${nome} definido para sua degustação de ${shortDate(t)}.`, tastingId: id });
        return {
          ...s,
          tastings: patch(s, id, (x) => {
            let y = ev({ ...x, promotorId: promoterId, status }, `Promotor ${nome} definido`, me.nome);
            if (confirm) y = ev(y, 'Agendamento confirmado', me.nome);
            return y;
          }),
          notifications: notifs,
        };
      });
      toast(confirm ? `Degustação confirmada com ${nome}` : `${nome} selecionado(a)`, 'ok');
      if (confirm) toast('Promotor e vendedor notificados', 'info');
    },
    confirmPromoter(id: string) {
      const t = find(id);
      if (!t.promotorId) return;
      actions.assignPromoter(id, t.promotorId, true);
    },
    setStatus(id: string, status: Status) {
      mutate((s) => ({ ...s, tastings: patch(s, id, (t) => ev({ ...t, status }, `Status alterado para ${status.replace('_', ' ')}`, me.nome)) }));
      toast('Status atualizado');
    },
    startAction(id: string) {
      const t = find(id);
      const at = stamp();
      mutate((s) => ({
        ...s,
        tastings: patch(s, id, (x) => ev({ ...x, status: 'EM_ANDAMENTO', startedAt: at }, `Ação iniciada às ${at.slice(11, 16)}`, me.nome)),
        notifications: notif(
          { ...s, notifications: notif(s, { role: 'gestora', text: `${me.nome} iniciou a degustação em ${clientName(t.codcli)}.`, tastingId: id }) },
          { role: 'vendedor', userId: t.vendedorId, text: `Degustação em ${clientName(t.codcli)} iniciada às ${at.slice(11, 16)}.`, tastingId: id },
        ),
      }));
      toast(`Ação iniciada às ${at.slice(11, 16)}`);
    },
    finishAction(id: string, note: string, attendees: number) {
      const t = find(id);
      const at = stamp();
      mutate((s) => {
        const n1 = notif(s, { role: 'vendedor', userId: t.vendedorId, text: `Degustação em ${clientName(t.codcli)} finalizada — ${attendees} pessoas atendidas.`, tastingId: id });
        const n2 = notif({ ...s, notifications: n1 }, { role: 'gestora', text: `${me.nome} finalizou a degustação em ${clientName(t.codcli)}.`, tastingId: id });
        return {
          ...s,
          tastings: patch(s, id, (x) =>
            ev({ ...x, status: 'FINALIZADA', finishedAt: at, attendees, finalNote: note || 'Ação concluída normalmente.' }, `Ação finalizada — ${attendees} pessoas atendidas`, me.nome),
          ),
          notifications: n2,
        };
      });
      toast('Degustação finalizada com sucesso');
    },
    requestCancel(id: string, motivo: string, obs: string) {
      const t = find(id);
      mutate((s) => ({
        ...s,
        tastings: patch(s, id, (x) => ev({ ...x, cancelRequest: { motivo, obs, at: stamp(), by: me.nome } }, `Cancelamento solicitado — ${motivo}`, me.nome)),
        notifications: notif(s, { role: 'gestora', text: `Solicitação de cancelamento: ${clientName(t.codcli)} (${shortDate(t)}).`, tastingId: id }),
      }));
      toast('Solicitação de cancelamento enviada à gestora', 'info');
    },
    cancelTasting(id: string, motivo: string) {
      const t = find(id);
      mutate((s) => {
        let notifs = notif(s, { role: 'vendedor', userId: t.vendedorId, text: `Degustação de ${shortDate(t)} em ${clientName(t.codcli)} foi cancelada.`, tastingId: id });
        if (t.promotorId) notifs = notif({ ...s, notifications: notifs }, { role: 'promotor', userId: t.promotorId, text: `Degustação de ${shortDate(t)} em ${clientName(t.codcli)} foi cancelada.`, tastingId: id });
        return {
          ...s,
          tastings: patch(s, id, (x) => ev({ ...x, status: 'CANCELADA', cancelReason: motivo, cancelRequest: null }, `Cancelamento confirmado — ${motivo}`, me.nome)),
          notifications: notifs,
        };
      });
      toast('Agendamento cancelado');
    },
    confirmCancel(id: string) {
      const t = find(id);
      actions.cancelTasting(id, t.cancelRequest?.motivo ?? 'Outro');
    },
    rejectCancel(id: string) {
      const t = find(id);
      mutate((s) => ({
        ...s,
        tastings: patch(s, id, (x) => ev({ ...x, cancelRequest: null }, 'Solicitação de cancelamento recusada', me.nome)),
        notifications: notif(s, { role: 'vendedor', userId: t.vendedorId, text: `Cancelamento de ${clientName(t.codcli)} (${shortDate(t)}) foi recusado.`, tastingId: id }),
      }));
      toast('Solicitação recusada');
    },
  };

  const value: Ctx = {
    ...st,
    role,
    me,
    today,
    toasts,
    detailId,
    openDetail: setDetailId,
    nav: (page, navParams = {}) => {
      setSt((s) => ({ ...s, page, navParams }));
      window.scrollTo({ top: 0 });
    },
    login: (r) => setSt((s) => ({ ...s, session: { logged: true, role: r }, page: 'dashboard', navParams: {} })),
    logout: () => setSt((s) => ({ ...s, session: { ...s.session, logged: false } })),
    setRole: (r) => {
      setDetailId(null);
      setSt((s) => ({ ...s, session: { ...s.session, role: r }, page: 'dashboard', navParams: {} }));
    },
    client,
    clientName,
    sellerName,
    promoterName,
    brandName,
    productNames,
    typeName,
    scoped,
    myNotifications,
    ...actions,
    markAllRead: () =>
      setSt((s) => ({ ...s, notifications: s.notifications.map((n) => (n.role === role && (!n.userId || n.userId === me.id) ? { ...n, read: true } : n)) })),
    markRead: (id) => setSt((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
    simulateNotification: () => {
      const samples: Record<Role, string> = {
        vendedor: `Promotor Carlos Lima definido para sua degustação de 14/10.`,
        gestora: 'Nova solicitação de degustação recebida.',
        promotor: 'Nova degustação atribuída para 14/10 às 09:00.',
        admin: 'Importação de clientes agendada para hoje às 22:00.',
      };
      setSt((s) => ({ ...s, notifications: notif(s, { role, userId: role === 'vendedor' || role === 'promotor' ? me.id : undefined, text: samples[role] }) }));
    },
    updateSettings: (p) => setSt((s) => ({ ...s, settings: { ...s.settings, ...p } })),
    setList: (k, fn) => setSt((s) => ({ ...s, data: { ...s.data, [k]: fn(s.data[k]) } })),
    toast,
    resetDemo: () => {
      setSt({ ...seed(), session: { logged: true, role }, page: 'dashboard' });
      setDetailId(null);
      toast('Dados da demonstração restaurados', 'info');
    },
  };

  return <C.Provider value={value}>{children}</C.Provider>;
}
