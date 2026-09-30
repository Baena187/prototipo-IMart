import { useState } from 'react';
import { AppProvider, useApp } from './store';
import { canAccess, Sidebar, Topbar } from './components/Layout';
import { ToastHost } from './components/ui';
import { TastingDetail } from './components/TastingDetail';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Bookings } from './pages/Bookings';
import { NewBooking } from './pages/NewBooking';
import { CalendarPage } from './pages/CalendarPage';
import { ClientsPage } from './pages/Clients';
import { PromotersPage } from './pages/Promoters';
import { HistoryPage } from './pages/History';
import { AdminPage } from './pages/Admin';
import { SettingsPage } from './pages/SettingsPage';

function Shell() {
  const { session, page, role, toasts } = useApp();
  const [menu, setMenu] = useState(false);
  if (!session.logged) return <><Login /><ToastHost toasts={toasts} /></>;
  const p = canAccess(page, role) ? page : 'dashboard';
  return (
    <div className="min-h-screen">
      <Sidebar open={menu} onClose={() => setMenu(false)} />
      <div className="min-w-0 lg:pl-64">
        <Topbar onMenu={() => setMenu(true)} />
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          {p === 'dashboard' && <Dashboard />}
          {p === 'agendamentos' && <Bookings />}
          {p === 'novo' && <NewBooking />}
          {p === 'calendario' && <CalendarPage />}
          {p === 'clientes' && <ClientsPage />}
          {p === 'promotores' && <PromotersPage />}
          {p === 'historico' && <HistoryPage />}
          {p === 'admin' && <AdminPage />}
          {p === 'configuracoes' && <SettingsPage />}
        </main>
      </div>
      <TastingDetail />
      <ToastHost toasts={toasts} />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
