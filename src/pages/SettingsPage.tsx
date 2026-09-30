import { Database, RotateCcw, Server, Webhook } from 'lucide-react';
import { useApp } from '../store';
import { fmtBR } from '../lib/dates';
import { Badge, Button, Card, CardHeader, Field, PageHeader, inputCls } from '../components/ui';

export function SettingsPage() {
  const { settings, updateSettings, resetDemo, role, toast } = useApp();
  const num = (k: 'minLeadDays' | 'slotsPerPromoter', min: number, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(min, Math.min(max, Number(e.target.value) || min));
    updateSettings({ [k]: v });
  };
  return (
    <>
      <PageHeader title="Configurações" subtitle="Regras de agendamento e parâmetros da operação." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Regras de agendamento" subtitle="Aplicadas imediatamente ao calendário do vendedor." />
          <div className="space-y-5 p-5">
            <Field label="Antecedência mínima de agendamento (dias)" hint="Datas dentro deste prazo ficam bloqueadas para novas solicitações.">
              <input type="number" min={0} max={30} className={`${inputCls} max-w-[160px]`} value={settings.minLeadDays} onChange={num('minLeadDays', 0, 30)} />
            </Field>
            <Field label="Capacidade por promotor (ações por dia)" hint="Usada para calcular as vagas de cada data.">
              <input type="number" min={1} max={4} className={`${inputCls} max-w-[160px]`} value={settings.slotsPerPromoter} onChange={num('slotsPerPromoter', 1, 4)} />
            </Field>
            <div className="grid max-w-md grid-cols-2 gap-3">
              <Field label="Início da operação"><input type="time" className={inputCls} value={settings.operacaoInicio} onChange={(e) => updateSettings({ operacaoInicio: e.target.value })} /></Field>
              <Field label="Fim da operação"><input type="time" className={inputCls} value={settings.operacaoFim} onChange={(e) => updateSettings({ operacaoFim: e.target.value })} /></Field>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Modo demonstração" subtitle="Ajustes para apresentar o fluxo completo." />
          <div className="space-y-5 p-5">
            <Field label="Data de referência (“hoje” do sistema)" hint="O protótipo usa uma data fixa para manter os dados coerentes.">
              <input type="date" className={`${inputCls} max-w-[200px]`} value={settings.refDate} onChange={(e) => e.target.value && updateSettings({ refDate: e.target.value })} />
            </Field>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3.5">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-accent-500" checked={settings.allowStartAnyDate} onChange={(e) => updateSettings({ allowStartAnyDate: e.target.checked })} />
              <span>
                <span className="block text-sm font-semibold">Permitir iniciar ação fora da data</span>
                <span className="text-xs text-slate-500">Libera o botão “Iniciar ação” do promotor em qualquer dia, para demonstrar agendamentos futuros.</span>
              </span>
            </label>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3.5">
              <div>
                <p className="text-sm font-semibold">Restaurar dados da demonstração</p>
                <p className="text-xs text-slate-500">Descarta todas as alterações feitas neste navegador.</p>
              </div>
              <Button variant="secondary" onClick={resetDemo}><RotateCcw size={15} /> Restaurar</Button>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Integrações" subtitle="Origem da base de clientes e vendedores." />
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {[
              [Database, 'Planilhas (CSV / XLSX)', 'Disponível', `Última importação: ${settings.lastImport ? settings.lastImport.length === 10 ? settings.lastImport : fmtBR(settings.lastImport) : '—'}`],
              [Server, 'ERP WinThor', 'Em breve', 'Sincronização automática por CODCLI'],
              [Webhook, 'API de integração', 'Em breve', 'Webhooks de clientes e vendedores'],
            ].map(([Icon, t, s, d]) => {
              const I = Icon as typeof Database;
              return (
                <div key={t as string} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-700"><I size={18} /></span><Badge className={s === 'Disponível' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}>{(s as string).toUpperCase()}</Badge></div>
                  <p className="mt-3 text-sm font-semibold">{t as string}</p>
                  <p className="text-xs text-slate-500">{d as string}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      {role === 'gestora' && <p className="mt-4 text-xs text-slate-400" onClick={() => toast('Alterações salvas automaticamente')}>As alterações são salvas automaticamente.</p>}
    </>
  );
}
