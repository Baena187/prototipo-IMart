import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { StoreScopeProvider } from '@/contexts/StoreScopeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AppRoutes } from '@/routes';

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <StoreScopeProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </StoreScopeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
