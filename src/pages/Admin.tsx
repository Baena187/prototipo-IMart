import { useState } from 'react';
import { Pencil, Plus, Power } from 'lucide-react';
import { useApp, type DataKey } from '../store';
import { ROLE_LABEL } from '../data/catalog';
import { Badge, Button, Card, EmptyState, Field, Modal, PageHeader, cn, inputCls } from '../components/ui';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
interface FieldSpec { k: string; label: string; options?: [string, string][]; required?: boolean; span2?: boolean }
interface Entity {
  key: DataKey; tab: string; idKey: string; singular: string; fields: FieldSpec[];
  columns: [string, (r: Row) => React.ReactNode][];
}

export function AdminPage() {
  const { data, setList, toast, sellerName } = useApp();
  const [tab, setTab] = useState('users');
  const [edit, setEdit] = useState<{ row: Row | null } | null>(null);

  const ENT: Record<string, Entity> = {
    users: {
      key: 'users', tab: 'Usuários', idKey: 'id', singular: 'usuário',
      fields: [{ k: 'nome', label: 'Nome', required: true }, { k: 'email', label: 'E-mail', required: true }, { k: 'perfil', label: 'Perfil', options: Object.entries(ROLE_LABEL) as [string, string][] }],
      columns: [['Nome', (r) => <b className="font-medium">{r.nome}</b>], ['E-mail', (r) => r.email], ['Perfil', (r) => ROLE_LABEL[r.perfil as keyof typeof ROLE_LABEL]]],
    },
    clients: {
      key: 'clients', tab: 'Clientes', idKey: 'codcli', singular: 'cliente',
      fields: [
        { k: 'codcli', label: 'CODCLI', required: true }, { k: 'cnpj', label: 'CNPJ' }, { k: 'razao', label: 'Razão social', required: true, span2: true }, { k: 'fantasia', label: 'Nome fantasia', required: true },
        { k: 'rede', label: 'Rede' }, { k: 'cidade', label: 'Cidade', required: true }, { k: 'bairro', label: 'Bairro' }, { k: 'endereco', label: 'Endereço', span2: true },
        { k: 'vendedorId', label: 'Vendedor responsável', options: data.sellers.map((s) => [s.id, s.nome]) },
      ],
      columns: [['Código', (r) => <span className="font-mono text-xs">{r.codcli}</span>], ['Fantasia', (r) => r.fantasia], ['Cidade', (r) => r.cidade], ['Rede', (r) => r.rede], ['Vendedor', (r) => sellerName(r.vendedorId)]],
    },
    promoters: {
      key: 'promoters', tab: 'Promotores', idKey: 'id', singular: 'promotor',
      fields: [{ k: 'nome', label: 'Nome', required: true }, { k: 'email', label: 'E-mail' }, { k: 'telefone', label: 'Telefone' }, { k: 'cidade', label: 'Cidade base', required: true }],
      columns: [['Nome', (r) => r.nome], ['Cidade base', (r) => r.cidade], ['Telefone', (r) => r.telefone]],
    },
    sellers: {
      key: 'sellers', tab: 'Vendedores', idKey: 'id', singular: 'vendedor',
      fields: [{ k: 'nome', label: 'Nome', required: true }, { k: 'email', label: 'E-mail' }, { k: 'regional', label: 'Regional' }],
      columns: [['Nome', (r) => r.nome], ['E-mail', (r) => r.email], ['Regional', (r) => r.regional]],
    },
    products: {
      key: 'products', tab: 'Produtos', idKey: 'id', singular: 'produto',
      fields: [{ k: 'nome', label: 'Nome do produto', required: true }, { k: 'brandId', label: 'Marca', options: data.brands.map((b) => [b.id, b.nome]) }],
      columns: [['Produto', (r) => r.nome], ['Marca', (r) => data.brands.find((b) => b.id === r.brandId)?.nome]],
    },
    brands: {
      key: 'brands', tab: 'Marcas', idKey: 'id', singular: 'marca',
      fields: [{ k: 'nome', label: 'Nome da marca', required: true }],
      columns: [['Marca', (r) => r.nome], ['Produtos', (r) => data.products.filter((p) => p.brandId === r.id).length]],
    },
    types: {
      key: 'types', tab: 'Tipos de ação', idKey: 'id', singular: 'tipo de ação',
      fields: [{ k: 'nome', label: 'Nome', required: true }],
      columns: [['Tipo de ação', (r) => r.nome]],
    },
  };
  const e = ENT[tab];
  const rows = data[e.key] as Row[];

  const toggle = (r: Row) => {
    setList(e.key, ((l: Row[]) => l.map((x) => (x[e.idKey] === r[e.idKey] ? { ...x, ativo: !x.ativo } : x))) as never);
    toast(`${r.nome ?? r.fantasia} ${r.ativo ? 'desativado' : 'ativado'}`, 'info');
  };

  return (
    <>
      <PageHeader title="Administração" subtitle="Cadastros que alimentam o agendamento." actions={<Button variant="primary" onClick={() => setEdit({ row: null })}><Plus size={16} /> Novo {e.singular}</Button>} />
      <div className="scroll-thin mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {Object.entries(ENT).map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)} className={cn('-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition', tab === k ? 'border-accent-500 text-navy-900' : 'border-transparent text-slate-500 hover:text-navy-800')}>{v.tab}</button>
        ))}
      </div>
      <Card>
        {rows.length === 0 ? <EmptyState title="Nenhum registro" /> : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {e.columns.map(([h]) => <th key={h} className="px-4 py-3">{h}</th>)}<th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r[e.idKey]} className={cn('hover:bg-slate-50/80', !r.ativo && 'text-slate-400')}>
                    {e.columns.map(([h, f]) => <td key={h} className="px-4 py-3">{f(r)}</td>)}
                    <td className="px-4 py-3"><Badge className={r.ativo ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}>{r.ativo ? 'ATIVO' : 'INATIVO'}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEdit({ row: r })}><Pencil size={13} /> Editar</Button>
                      <Button size="sm" variant="ghost" onClick={() => toggle(r)}><Power size={13} /> {r.ativo ? 'Desativar' : 'Ativar'}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{rows.length} registros</div>
      </Card>
      {edit && <EditDialog key={tab + (edit.row?.[e.idKey] ?? 'novo')} entity={e} row={edit.row} onClose={() => setEdit(null)} />}
    </>
  );
}

function EditDialog({ entity, row, onClose }: { entity: Entity; row: Row | null; onClose: () => void }) {
  const { setList, toast, data } = useApp();
  const [f, setF] = useState<Row>(() => row ?? Object.fromEntries(entity.fields.map((x) => [x.k, x.options ? x.options[0][0] : ''])));
  const missing = entity.fields.some((x) => x.required && !String(f[x.k] ?? '').trim());
  const dup = !row && entity.idKey === 'codcli' && data.clients.some((c) => c.codcli === f.codcli);

  const save = () => {
    const apply = (l: Row[]): Row[] => {
      if (row) return l.map((x) => (x[entity.idKey] === row[entity.idKey] ? { ...x, ...f } : x));
      const id = entity.idKey === 'codcli' ? f.codcli : `${entity.key[0]}${Date.now().toString(36)}`;
      const extra = entity.key === 'users' ? {} : entity.key === 'clients' ? { vendedorId: f.vendedorId ?? data.sellers[0].id } : {};
      return [...l, { ...extra, ...f, [entity.idKey]: id, ativo: true }];
    };
    setList(entity.key, apply as never);
    toast(row ? 'Cadastro atualizado' : `Novo ${entity.singular} cadastrado`);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={`${row ? 'Editar' : 'Novo'} ${entity.singular}`} footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" disabled={missing || dup} onClick={save}>Salvar</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {entity.fields.map((x) => (
          <Field key={x.k} label={x.label + (x.required ? ' *' : '')} className={x.span2 ? 'sm:col-span-2' : ''} hint={x.k === 'codcli' && dup ? 'Já existe um cliente com este código.' : undefined}>
            {x.options ? (
              <select className={inputCls} value={f[x.k] ?? ''} onChange={(ev) => setF({ ...f, [x.k]: ev.target.value })}>{x.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            ) : (
              <input className={inputCls} value={f[x.k] ?? ''} disabled={!!row && x.k === entity.idKey} onChange={(ev) => setF({ ...f, [x.k]: ev.target.value })} />
            )}
          </Field>
        ))}
      </div>
    </Modal>
  );
}
