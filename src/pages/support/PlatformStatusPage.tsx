import { CircleCheck, TriangleAlert } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { formatPercent } from '@/utils/format';
import { createRng } from '@/utils/random';
import { NOW } from '@/utils/time';

const COMPONENTS = [
  { name: 'Painel iMart Control (web)', uptime: 99.98 },
  { name: 'API de publicação', uptime: 99.95 },
  { name: 'Serviço de sincronização com lojas', uptime: 99.87, degraded: true },
  { name: 'Processamento de visão computacional', uptime: 99.91 },
  { name: 'Notificações e alertas', uptime: 99.99 },
  { name: 'Autenticação', uptime: 100 },
];

function bars(seed: number, degraded?: boolean) {
  const rng = createRng(seed);
  return Array.from({ length: 60 }, (_, i) => {
    const d = new Date(NOW - (59 - i) * 864e5);
    const r = rng.next();
    const state = degraded && i === 59 ? 'warn' : r > 0.97 ? 'warn' : 'ok';
    return { date: d.toLocaleDateString('pt-BR'), state };
  });
}

export default function PlatformStatusPage() {
  return (
    <div>
      <PageHeader title="Status da plataforma" description="Disponibilidade dos serviços iMart nos últimos 60 dias." />
      <Card className="mb-4 flex items-center gap-3 border-amber-200 bg-amber-50/50 px-5 py-4">
        <TriangleAlert className="h-5 w-5 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-slate-900">Degradação parcial na sincronização da Loja Dourados</p>
          <p className="text-[13px] text-slate-600">Link de internet da loja com perda de pacotes. Demais lojas operam normalmente. Chamado IM-1043 em andamento.</p>
        </div>
      </Card>
      <Card>
        <CardHeader title="Componentes" actions={<Badge tone="green" dot>Operacional</Badge>} />
        <ul className="divide-y divide-slate-100">
          {COMPONENTS.map((c, idx) => (
            <li key={c.name} className="px-5 py-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  {c.degraded ? <TriangleAlert className="h-4 w-4 text-amber-500" /> : <CircleCheck className="h-4 w-4 text-emerald-600" />}
                  {c.name}
                </span>
                <span className="text-[13px] tabular-nums text-slate-500">{formatPercent(c.uptime, 2)} de disponibilidade</span>
              </div>
              <div className="flex gap-[2px]">
                {bars(idx + 11, c.degraded).map((b, i) => (
                  <span
                    key={i}
                    title={`${b.date} · ${b.state === 'ok' ? 'Operacional' : 'Degradação parcial'}`}
                    className={cn('block h-7 min-w-0 flex-1 rounded-[2px] transition-opacity hover:opacity-70', b.state === 'ok' ? 'bg-emerald-500/80' : 'bg-amber-400')}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
