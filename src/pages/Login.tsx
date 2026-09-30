import { useState } from 'react';
import { ArrowRight, CalendarCheck, ChefHat, ClipboardCheck } from 'lucide-react';
import { useApp } from '../store';
import type { Role } from '../types';
import { Logo } from '../components/Layout';
import { Button, Field, inputCls } from '../components/ui';
import { DEMO_IDENTITY } from '../data/catalog';

const PROFILES: { role: Role; label: string }[] = [
  { role: 'vendedor', label: 'Vendedor' },
  { role: 'gestora', label: 'Gestora' },
  { role: 'promotor', label: 'Promotor' },
  { role: 'admin', label: 'Administrador' },
];

export function Login() {
  const { login } = useApp();
  const [role, setRole] = useState<Role>('vendedor');
  const [email, setEmail] = useState(DEMO_IDENTITY.vendedor.email);
  const [senha, setSenha] = useState('demonstracao');
  const [loading, setLoading] = useState(false);

  const pick = (r: Role) => { setRole(r); setEmail(DEMO_IDENTITY[r].email); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const found = (Object.keys(DEMO_IDENTITY) as Role[]).find((r) => DEMO_IDENTITY[r].email === email.trim().toLowerCase());
    setTimeout(() => login(found ?? role), 450);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-12 text-white lg:flex">
        <Logo light />
        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">Degustações em clientes, do pedido à execução, em um só lugar.</h1>
          <p className="mt-4 text-navy-200">Vendedor solicita, a gestora define o promotor e o promotor executa — tudo registrado, sem mensagens soltas nem planilhas paralelas.</p>
          <ul className="mt-10 space-y-5 text-sm">
            {[
              [CalendarCheck, 'Disponibilidade em tempo real', 'Datas e horários validados contra a agenda dos promotores.'],
              [ClipboardCheck, 'Base de clientes oficial', 'O vendedor seleciona o cliente da base — sem digitação manual.'],
              [ChefHat, 'Execução rastreável', 'Início, fim e resultado de cada ação registrados pelo promotor.'],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof CalendarCheck;
              return (
                <li key={t as string} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-accent-400"><I size={20} /></span>
                  <span><span className="block font-semibold">{t as string}</span><span className="text-navy-300">{d as string}</span></span>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="text-xs text-navy-400">© 2026 Agenda Promo · Ambiente de demonstração com dados fictícios</p>
      </div>

      <div className="flex items-center justify-center bg-white px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-10 lg:hidden"><Logo /></div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-900">Acesse sua conta</h2>
          <p className="mt-1.5 text-sm text-slate-500">Entre com seu e-mail corporativo.</p>
          <div className="mt-8 space-y-4">
            <Field label="E-mail"><input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></Field>
            <Field label="Senha"><input className={inputCls} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required /></Field>
          </div>
          <Button type="submit" variant="primary" size="lg" className="mt-6 w-full" disabled={loading}>
            {loading ? 'ENTRANDO…' : <>ENTRAR <ArrowRight size={16} /></>}
          </Button>
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-navy-700">Acesso de demonstração</p>
            <p className="mt-0.5 text-xs text-slate-500">Escolha um perfil para preencher o login automaticamente.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PROFILES.map((p) => (
                <button key={p.role} type="button" onClick={() => pick(p.role)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition ${role === p.role ? 'bg-navy-900 text-white ring-navy-900' : 'bg-white text-navy-700 ring-slate-300 hover:bg-slate-100'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
