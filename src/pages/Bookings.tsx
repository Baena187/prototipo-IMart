import { useMemo, useState } from 'react';
import { CalendarPlus, Search } from 'lucide-react';
import { useApp } from '../store';
import { isPending } from '../lib/status';
import { TastingTable } from '../components/TastingTable';
import { Button, Card, PageHeader, Segmented, inputCls } from '../components/ui';

const FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendentes', label: 'Em análise' },
  { value: 'CONFIRMADA', label: 'Confirmadas' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'FINALIZADA', label: 'Finalizadas' },
  { value: 'CANCELADA', label: 'Canceladas' },
];

export function Bookings() {
  const { scoped, role, nav, navParams, client, brandName, sellerName, promoterName, today } = useApp();
  const [f, setF] = useState(navParams.status ?? 'todos');
  const [q, setQ] = useState('');
  const manager = role !== 'vendedor';

  const match = (s: string, t: (typeof scoped)[number]) => (s === 'todos' ? true : s === 'pendentes' ? isPending(t.status) : t.status === s);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return scoped
      .filter((t) => match(f, t))
      .filter((t) => !term || `${client(t.codcli)?.fantasia} ${client(t.codcli)?.cidade} ${brandName(t)} ${sellerName(t.vendedorId)} ${promoterName(t.promotorId)} ${t.id}`.toLowerCase().includes(term))
      .sort((a, b) => {
        const fa = a.date >= today ? 0 : 1;
        const fb = b.date >= today ? 0 : 1;
        return fa - fb || (fa === 0 ? (a.date + a.start).localeCompare(b.date + b.start) : (b.date + b.start).localeCompare(a.date + a.start));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, f, q, today]);

  return (
    <>
      <PageHeader
        title={manager ? 'Solicitações de degustação' : 'Meus agendamentos'}
        subtitle={manager ? 'Analise as solicitações e defina o promotor responsável.' : 'Todas as degustações solicitadas por você.'}
        actions={<Button variant="primary" onClick={() => nav('novo')}><CalendarPlus size={16} /> Agendar degustação</Button>}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="scroll-thin -mx-1 overflow-x-auto px-1">
            <Segmented value={f} onChange={setF} options={FILTERS.map((o) => ({ ...o, count: scoped.filter((t) => match(o.value, t)).length }))} />
          </div>
          <div className="relative lg:w-72">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} pl-9`} placeholder="Buscar por cliente, marca, promotor…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <TastingTable rows={rows} />
      </Card>
    </>
  );
}
