import { useMemo, useState } from 'react';
import { FilterX } from 'lucide-react';
import { useApp } from '../store';
import { STATUS_LABEL, STATUS_ORDER } from '../lib/status';
import { fmtBR } from '../lib/dates';
import { Button, Card, EmptyState, PageHeader, StatusBadge, inputCls, Field } from '../components/ui';

const EMPTY = { from: '', to: '', cliente: '', cidade: '', vendedor: '', promotor: '', marca: '', status: '' };

export function HistoryPage() {
  const { scoped, data, role, client, brandName, productNames, sellerName, promoterName, openDetail } = useApp();
  const [f, setF] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const rows = useMemo(() => {
    const term = f.cliente.trim().toLowerCase();
    return scoped
      .filter((t) => !f.from || t.date >= f.from)
      .filter((t) => !f.to || t.date <= f.to)
      .filter((t) => !term || `${client(t.codcli)?.fantasia} ${t.codcli}`.toLowerCase().includes(term))
      .filter((t) => !f.cidade || client(t.codcli)?.cidade === f.cidade)
      .filter((t) => !f.vendedor || t.vendedorId === f.vendedor)
      .filter((t) => !f.promotor || t.promotorId === f.promotor)
      .filter((t) => !f.marca || t.brandId === f.marca)
      .filter((t) => !f.status || t.status === f.status)
      .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
  }, [scoped, f, client]);

  const cidades = [...new Set(data.clients.map((c) => c.cidade))].sort();
  const dirty = JSON.stringify(f) !== JSON.stringify(EMPTY);

  return (
    <>
      <PageHeader title="Histórico de Degustações" subtitle={role === 'vendedor' ? 'Todas as suas degustações, em qualquer status.' : role === 'promotor' ? 'Todas as ações atribuídas a você.' : 'Consulta completa de todas as degustações.'} />
      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Período — de"><input type="date" className={inputCls} value={f.from} onChange={set('from')} /></Field>
          <Field label="Período — até"><input type="date" className={inputCls} value={f.to} onChange={set('to')} /></Field>
          <Field label="Cliente"><input className={inputCls} placeholder="Nome ou código" value={f.cliente} onChange={set('cliente')} /></Field>
          <Field label="Cidade"><select className={inputCls} value={f.cidade} onChange={set('cidade')}><option value="">Todas</option>{cidades.map((c) => <option key={c}>{c}</option>)}</select></Field>
          {role !== 'vendedor' && <Field label="Vendedor"><select className={inputCls} value={f.vendedor} onChange={set('vendedor')}><option value="">Todos</option>{data.sellers.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></Field>}
          {role !== 'promotor' && <Field label="Promotor"><select className={inputCls} value={f.promotor} onChange={set('promotor')}><option value="">Todos</option>{data.promoters.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></Field>}
          <Field label="Marca"><select className={inputCls} value={f.marca} onChange={set('marca')}><option value="">Todas</option>{data.brands.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}</select></Field>
          <Field label="Status"><select className={inputCls} value={f.status} onChange={set('status')}><option value="">Todos</option>{STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></Field>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          <span>{rows.length} {rows.length === 1 ? 'registro' : 'registros'}</span>
          {dirty && <Button size="sm" variant="ghost" onClick={() => setF(EMPTY)}><FilterX size={14} /> Limpar filtros</Button>}
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Nenhum registro encontrado" text="Ajuste os filtros para ampliar a busca." />
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {['Data', 'Cliente', 'Marca', 'Produto', 'Vendedor', 'Promotor', 'Status'].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((t) => (
                  <tr key={t.id} onClick={() => openDetail(t.id)} className="cursor-pointer hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold tabular">{fmtBR(t.date)}</td>
                    <td className="px-4 py-3"><div className="max-w-[220px] truncate font-medium">{client(t.codcli)?.fantasia}</div><div className="text-[11px] text-slate-400">{client(t.codcli)?.cidade}</div></td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{brandName(t)}</td>
                    <td className="px-4 py-3 text-slate-600"><div className="max-w-[220px] truncate">{productNames(t).join(', ')}</div></td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{sellerName(t.vendedorId)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{promoterName(t.promotorId)}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
