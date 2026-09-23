import { Lock, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('daniel.souza@imart.com.br');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/', { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex flex-col items-center text-center">
            <LogoMark className="h-11 w-11" />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">iMart</h1>
            <p className="mt-1 text-sm text-slate-500">Gestão inteligente para o ponto de venda</p>
          </div>

          <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="space-y-4">
              <Field label="E-mail" htmlFor="email">
                <Input id="email" type="email" autoComplete="email" icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Senha" htmlFor="password">
                <Input id="password" type="password" autoComplete="current-password" icon={<Lock />} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Entrar
              </Button>
            </div>
          </form>
          <p className="mt-6 text-center text-xs text-slate-400">Ambiente de demonstração · dados fictícios</p>
        </div>
      </div>
      <footer className="pb-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} iMart · iMart Control</footer>
    </div>
  );
}
