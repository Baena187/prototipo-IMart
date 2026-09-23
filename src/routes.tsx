import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/LoginPage';

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const StoresPage = lazy(() => import('@/pages/stores/StoresPage'));
const StoreDetailPage = lazy(() => import('@/pages/stores/StoreDetailPage'));
const GondolasPage = lazy(() => import('@/pages/gondolas/GondolasPage'));
const GondolaDetailPage = lazy(() => import('@/pages/gondolas/GondolaDetailPage'));
const ShelvesPage = lazy(() => import('@/pages/shelves/ShelvesPage'));
const ShelfEditorPage = lazy(() => import('@/pages/shelves/ShelfEditorPage'));
const ProductsPage = lazy(() => import('@/pages/products/ProductsPage'));
const PricesPage = lazy(() => import('@/pages/prices/PricesPage'));
const CampaignsPage = lazy(() => import('@/pages/campaigns/CampaignsPage'));
const CampaignFormPage = lazy(() => import('@/pages/campaigns/CampaignFormPage'));
const MonitoringPage = lazy(() => import('@/pages/monitoring/MonitoringPage'));
const CamerasPage = lazy(() => import('@/pages/cameras/CamerasPage'));
const AlertsPage = lazy(() => import('@/pages/alerts/AlertsPage'));
const OperationsPage = lazy(() => import('@/pages/operations/OperationsPage'));
const ContractPage = lazy(() => import('@/pages/contract/ContractPage'));
const AuditPage = lazy(() => import('@/pages/audit/AuditPage'));
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const SupportPage = lazy(() => import('@/pages/support/SupportPage'));
const PlatformStatusPage = lazy(() => import('@/pages/support/PlatformStatusPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const page = (node: ReactNode) => <Suspense fallback={<PageSkeleton />}>{node}</Suspense>;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route index element={page(<DashboardPage />)} />
        <Route path="lojas" element={page(<StoresPage />)} />
        <Route path="lojas/:id" element={page(<StoreDetailPage />)} />
        <Route path="gondolas" element={page(<GondolasPage />)} />
        <Route path="gondolas/:id" element={page(<GondolaDetailPage />)} />
        <Route path="reguas" element={page(<ShelvesPage />)} />
        <Route path="reguas/:id/editor" element={page(<ShelfEditorPage />)} />
        <Route path="produtos" element={page(<ProductsPage />)} />
        <Route path="precos" element={page(<PricesPage />)} />
        <Route path="campanhas" element={page(<CampaignsPage />)} />
        <Route path="campanhas/nova" element={page(<CampaignFormPage />)} />
        <Route path="campanhas/:id" element={page(<CampaignFormPage />)} />
        <Route path="monitoramento" element={page(<MonitoringPage />)} />
        <Route path="cameras" element={page(<CamerasPage />)} />
        <Route path="alertas" element={page(<AlertsPage />)} />
        <Route path="operacoes" element={page(<OperationsPage />)} />
        <Route path="contrato" element={page(<ContractPage />)} />
        <Route path="auditoria" element={page(<AuditPage />)} />
        <Route path="usuarios" element={page(<UsersPage />)} />
        <Route path="configuracoes" element={page(<SettingsPage />)} />
        <Route path="suporte" element={page(<SupportPage />)} />
        <Route path="status" element={page(<PlatformStatusPage />)} />
        <Route path="*" element={page(<NotFoundPage />)} />
      </Route>
    </Routes>
  );
}
