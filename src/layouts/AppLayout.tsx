import { useCallback, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/contexts/AuthContext';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useQuery } from '@/hooks/useQuery';
import { db, pricesService, shelvesService } from '@/services';
import { AlertStatus, PriceChangeStatus } from '@/types';

export function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  useKeyboardShortcut('k', openSearch);

  const { data: counts } = useQuery(
    () =>
      Promise.resolve({
        alerts: db.alerts.all().filter((a) => a.status === AlertStatus.Aberto).length,
        approvals: db.prices.all().filter((p) => p.status === PriceChangeStatus.AguardandoAprovacao).length,
      }),
    [],
  );

  // Publicações agendadas (em produção: job no servidor).
  useEffect(() => {
    const tick = () => {
      pricesService.processScheduled();
      shelvesService.processScheduled();
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const c = counts ?? { alerts: 0, approvals: 0 };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] lg:block">
        <Sidebar counts={c} />
      </aside>
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-slate-900/30" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[264px] animate-fade-in">
            <Sidebar counts={c} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex min-h-screen flex-col lg:pl-[248px]">
        <Topbar onOpenSearch={openSearch} onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
