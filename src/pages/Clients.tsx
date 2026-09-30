import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, FileUp, Search, Upload } from 'lucide-react';
import { useApp } from '../store';
import { Badge, Button, Card, EmptyState, Modal, PageHeader, Segmented, inputCls, cn } from '../components/ui';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function ClientsPage() {
  const { data, role, me, navParams, sellerName } = useApp();
  const [q, setQ] = useState(navParams.q ?? '');
  const [cidade, setCidade] = useState('');
  const [rede, setRede] = useState('');
  const [status, setStatus] = useState('todos');
  const [scope, setScope] = useState<'meus' | 'todos'>(role === 'vendedor' ? 'meus' : 'todos');
  const [imp, setImp] = useState(false);
  const canImport = role === 'gestora' || role === 'admin';

  const cidades = [...new Set(data.clients.map((c) => c.cidade))].sort();
  const redes = [...new Set(data.clients.map((c) => c.rede))].sort();
  const rows = useMemo(() => {
    const term = norm(q.trim());
    const digits = q.replace(/\D/g, '');
    return data.clients
      .filter((c) => (role === 'vendedor' && scope === 'meus' ? c.vendedorId === me.id : true))
      .filter((c) => !cidade || c.cidade === cidade)
      .filter((c) => !rede || c.rede === rede)
      .filter((c) => status === 'todos' || (status === 'ativos') === c.ativo)
      .filter((c) => !term || norm(`${c.codcli} ${c.razao} ${c.fantasia} ${c.cidade} ${c.bairro} ${c.rede}`).includes(term) || (digits.length >= 3 && c.cnpj.replace(/\D/g, '').includes(digits)))
      .sort((a, b) => a.fantasia.localeCompare(b.fantasia));
  }, [data.clients, q, cidade, rede, status, scope, role, me.id]);

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Base de clientes identificada por CODCLI — carregada do ERP ou importada por planilha."
        actions={canImport && <Button variant="dark" onClick={() => setImp(true)}><Upload size={16} /> IMPORTAR CLIENTES</Button>}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} pl-9`} placeholder="Buscar por código, razão social, fantasia, cidade, bairro ou CNPJ" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className={`${inputCls} w-auto`} value={cidade} onChange={(e) => setCidade(e.target.value)}><option value="">Todas as cidades</option>{cidades.map((c) => <option key={c}>{c}</option>)}</select>
            <select className={`${inputCls} w-auto`} value={rede} onChange={(e) => setRede(e.target.value)}><option value="">Todas as redes</option>{redes.map((c) => <option key={c}>{c}</option>)}</select>
            <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}><option value="todos">Ativos e inativos</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option></select>
            {role === 'vendedor' && <Segmented value={scope} onChange={setScope} options={[{ value: 'meus', label: 'Minha carteira' }, { value: 'todos', label: 'Todos' }]} />}
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Nenhum cliente encontrado" text="Revise os filtros aplicados." />
        ) : (
          <>
            <div className="scroll-thin hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {['Código', 'Razão Social', 'Fantasia', 'Cidade', 'Bairro', 'Rede', 'Vendedor', 'Status'].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((c) => (
                    <tr key={c.codcli} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{c.codcli}</td>
                      <td className="max-w-[240px] px-4 py-3"><div className="truncate text-slate-600">{c.razao}</div><div className="text-[11px] text-slate-400">CNPJ {c.cnpj}</div></td>
                      <td className="px-4 py-3 font-medium">{c.fantasia}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{c.cidade}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{c.bairro}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{c.rede}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{sellerName(c.vendedorId)}</td>
                      <td className="px-4 py-3"><Badge className={c.ativo ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}>{c.ativo ? 'ATIVO' : 'INATIVO'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">
              {rows.map((c) => (
                <li key={c.codcli} className="p-4">
                  <div className="flex items-center justify-between"><span className="font-mono text-xs font-semibold text-slate-500">{c.codcli}</span><Badge className={c.ativo ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}>{c.ativo ? 'ATIVO' : 'INATIVO'}</Badge></div>
                  <p className="mt-1 font-semibold">{c.fantasia}</p>
                  <p className="text-xs text-slate-500">{c.razao}</p>
                  <p className="mt-1 text-xs text-slate-500">{c.cidade} · {c.bairro} · {c.rede}</p>
                  <p className="text-xs text-slate-500">Vendedor: {sellerName(c.vendedorId)}</p>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{rows.length} de {data.clients.length} clientes</div>
      </Card>
      {imp && <ImportDialog onClose={() => setImp(false)} />}
    </>
  );
}

function ImportDialog({ onClose }: { onClose: () => void }) {
  const { updateSettings, toast } = useApp();
  const [file, setFile] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'reading' | 'done'>('idle');

  const pick = (name: string) => {
    setFile(name);
    setPhase('reading');
    setTimeout(() => setPhase('done'), 1100);
  };
  const confirm = () => {
    updateSettings({ lastImport: '08/10/2026' });
    toast('Importação concluída: 245 clientes atualizados', 'ok');
    onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Importar base de clientes"
      subtitle="A base pode vir de planilha, do ERP WinThor ou de integração por API."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={phase !== 'done'} onClick={confirm}>CONFIRMAR IMPORTAÇÃO</Button>
        </>
      }
    >
      {phase === 'idle' && (
        <>
          <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-accent-500 hover:bg-accent-50/30">
            <FileUp size={30} className="text-slate-400" />
            <span className="mt-3 text-sm font-semibold">Arraste o arquivo ou clique para selecionar</span>
            <span className="mt-1 text-xs text-slate-500">Formatos aceitos: CSV, XLSX</span>
            <input type="file" accept=".csv,.xlsx" className="sr-only" onChange={(e) => pick(e.target.files?.[0]?.name ?? 'clientes.xlsx')} />
          </label>
          <button onClick={() => pick('clientes_winthor_out2026.xlsx')} className="mt-3 w-full text-center text-xs font-semibold text-accent-600 hover:underline">Usar arquivo de exemplo (clientes_winthor_out2026.xlsx)</button>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            {['Excel', 'CSV', 'ERP WinThor', 'API'].map((s, i) => <Badge key={s} className={i < 2 ? 'bg-navy-50 text-navy-700 ring-navy-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}>{s}{i >= 2 && ' · em breve'}</Badge>)}
          </div>
        </>
      )}
      {phase === 'reading' && (
        <div className="flex flex-col items-center py-10 text-center">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-accent-500" />
          <p className="mt-4 text-sm font-semibold">Validando {file}…</p>
          <p className="text-xs text-slate-500">Conferindo CODCLI, CNPJ e vínculo com vendedores</p>
        </div>
      )}
      {phase === 'done' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm"><FileSpreadsheet size={20} className="text-emerald-600" /><span className="font-medium">{file}</span></div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[['247', 'clientes identificados', 'text-navy-900'], ['245', 'válidos', 'text-emerald-600'], ['2', 'com inconsistências', 'text-amber-600']].map(([n, l, c]) => (
              <div key={l} className="rounded-xl border border-slate-200 p-3"><div className={cn('text-2xl font-bold', c)}>{n}</div><div className="text-xs text-slate-500">{l}</div></div>
            ))}
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="mb-1.5 flex items-center gap-1.5 font-semibold"><AlertTriangle size={15} /> Inconsistências (não serão importadas)</p>
            <ul className="space-y-1 text-xs">
              <li>Linha 88 · CODCLI 001342 — CNPJ inválido (13 dígitos)</li>
              <li>Linha 201 · CODCLI 000245 — código duplicado na planilha</li>
            </ul>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-slate-500"><CheckCircle2 size={14} className="text-emerald-500" /> Clientes existentes serão atualizados pelo CODCLI; nenhum agendamento é afetado.</p>
        </div>
      )}
    </Modal>
  );
}
