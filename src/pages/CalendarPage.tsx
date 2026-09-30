import { useState } from 'react';
import { useApp } from '../store';
import { AgendaCalendar } from '../components/CalendarView';
import { PageHeader, inputCls } from '../components/ui';
import { STATUS_LABEL, STATUS_STYLE, STATUS_ORDER } from '../lib/status';

export function CalendarPage() {
  const { scoped, role, data } = useApp();
  const [p, setP] = useState('todos');
  const manager = role === 'gestora' || role === 'admin';
  const rows = p === 'todos' ? scoped : scoped.filter((t) => t.promotorId === p);
  return (
    <>
      <PageHeader
        title="Calendário"
        subtitle={role === 'vendedor' ? 'Suas degustações por dia.' : role === 'promotor' ? 'Sua agenda de ações.' : 'Degustações de toda a operação por dia.'}
        actions={manager && (
          <select className={`${inputCls} w-56`} value={p} onChange={(e) => setP(e.target.value)} aria-label="Filtrar por promotor">
            <option value="todos">Todos os promotores</option>
            {data.promoters.filter((x) => x.ativo).map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
          </select>
        )}
      />
      <AgendaCalendar rows={rows} />
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
        {STATUS_ORDER.filter((s) => s !== 'CANCELADA').map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${STATUS_STYLE[s].dot}`} />{STATUS_LABEL[s]}</span>
        ))}
      </div>
    </>
  );
}
