import { Database, Plug, RotateCcw } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Forbidden } from '@/components/shared/Forbidden';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input, Switch } from '@/components/ui/form';
import { Tabs } from '@/components/ui/misc';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useQuery } from '@/hooks/useQuery';
import { settingsService } from '@/services';
import type { AppSettings } from '@/types';

function Row({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const INTEGRATIONS = [
  { name: 'ERP (preços e cadastro)', description: 'Sincronização de produtos e preços com o ERP da rede.', status: 'Planejado' },
  { name: 'PDV / frente de caixa', description: 'Conferência de divergências entre PDV e régua.', status: 'Planejado' },
  { name: 'API REST iMart', description: 'Integração de sistemas terceiros com a plataforma.', status: 'Disponível' },
  { name: 'Webhooks de eventos', description: 'Envio de alertas e publicações para sistemas externos.', status: 'Disponível' },
];

export default function SettingsPage() {
  const toast = useToast();
  const { can } = useAuth();
  const { data, loading } = useQuery(() => settingsService.get(), []);
  const [form, setForm] = useState<AppSettings>();
  const [tab, setTab] = useState<'geral' | 'publicacao' | 'notificacoes' | 'integracoes'>('publicacao');
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  if (!can('settings.manage')) return <Forbidden />;
  if (loading || !form) return <PageSkeleton />;

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => setForm({ ...form, [k]: v });
  const dirty = JSON.stringify(form) !== JSON.stringify(data);

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Regras de publicação, aprovação e notificações da rede."
        actions={
          <>
            <Button variant="outline" disabled={!dirty} onClick={() => setForm(data)}>
              Descartar
            </Button>
            <Button
              disabled={!dirty}
              loading={saving}
              onClick={async () => {
                setSaving(true);
                const saved = await settingsService.update(form);
                setForm(saved);
                setSaving(false);
                toast.success('Configurações salvas', 'Alteração registrada na auditoria.');
              }}
            >
              Salvar alterações
            </Button>
          </>
        }
      />
      <Card>
        <Tabs
          className="px-2"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'publicacao', label: 'Publicação e aprovação' },
            { value: 'geral', label: 'Geral' },
            { value: 'notificacoes', label: 'Notificações' },
            { value: 'integracoes', label: 'Integrações' },
          ]}
        />
        <CardContent className="py-2">
          {tab === 'publicacao' && (
            <>
              <Row title="Exigir aprovação de gerente" description="Alterações de preço relevantes só vão para as réguas após aprovação do gerente da loja.">
                <Switch label="Exigir aprovação" checked={form.requireManagerApproval} onChange={(v) => set('requireManagerApproval', v)} />
              </Row>
              <Row title="Limite de variação para aprovação" description="Alterações com variação igual ou superior a este percentual exigem aprovação.">
                <div className="flex items-center gap-2">
                  <Input type="number" min={1} max={50} className="w-24" value={form.approvalThresholdPct} disabled={!form.requireManagerApproval} onChange={(e) => set('approvalThresholdPct', Number(e.target.value))} />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              </Row>
              <Row title="Aprovação de campanhas" description="Campanhas criadas por Marketing e Operadores precisam de aprovação antes da publicação.">
                <Switch label="Aprovação de campanhas" checked={form.approvalForCampaigns} onChange={(v) => set('approvalForCampaigns', v)} />
              </Row>
              <Row title="Janela de publicação" description="Publicações agendadas fora da janela aguardam o próximo horário permitido.">
                <div className="flex items-center gap-2">
                  <Input type="time" className="w-28" value={form.publicationWindowStart} onChange={(e) => set('publicationWindowStart', e.target.value)} />
                  <span className="text-sm text-slate-500">às</span>
                  <Input type="time" className="w-28" value={form.publicationWindowEnd} onChange={(e) => set('publicationWindowEnd', e.target.value)} />
                </div>
              </Row>
              <Row title="Brilho padrão das réguas" description="Aplicado em novas réguas e após reinicialização.">
                <div className="flex items-center gap-3">
                  <input type="range" min={30} max={100} step={5} value={form.defaultBrightness} onChange={(e) => set('defaultBrightness', Number(e.target.value))} className="w-40 accent-brand-700" />
                  <span className="w-10 text-sm tabular-nums text-slate-700">{form.defaultBrightness}%</span>
                </div>
              </Row>
            </>
          )}
          {tab === 'geral' && (
            <>
              <Row title="Nome da rede" description="Exibido em relatórios e cabeçalhos.">
                <Input className="w-72" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
              </Row>
              <Row title="Idioma e formato" description="Datas em dd/mm/aaaa, horários em HH:mm e valores em R$.">
                <Badge tone="outline">Português (Brasil)</Badge>
              </Row>
              <Row title="Fuso horário">
                <Badge tone="outline">America/Sao_Paulo (UTC−03:00)</Badge>
              </Row>
            </>
          )}
          {tab === 'notificacoes' && (
            <>
              <Row title="Alerta de heartbeat" description="Gera alerta quando um dispositivo fica sem comunicação por mais de:">
                <div className="flex items-center gap-2">
                  <Input type="number" min={1} max={60} className="w-24" value={form.heartbeatAlertMinutes} onChange={(e) => set('heartbeatAlertMinutes', Number(e.target.value))} />
                  <span className="text-sm text-slate-500">minutos</span>
                </div>
              </Row>
              <Row title="Resumo diário por e-mail" description="Indicadores da operação enviados às 07:00.">
                <Switch label="Resumo por e-mail" checked={form.notifyEmail} onChange={(v) => set('notifyEmail', v)} />
              </Row>
              <Row title="Notificar alertas críticos imediatamente" description="Envia notificação para gerentes e suporte.">
                <Switch label="Alertas críticos" checked={form.notifyCritical} onChange={(v) => set('notifyCritical', v)} />
              </Row>
            </>
          )}
          {tab === 'integracoes' && (
            <div className="grid grid-cols-1 gap-3 py-3 md:grid-cols-2">
              {INTEGRATIONS.map((i) => (
                <div key={i.name} className="flex items-start gap-3 rounded-md border border-slate-200 p-4">
                  <Plug className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{i.name}</p>
                      <Badge tone={i.status === 'Disponível' ? 'green' : 'neutral'}>{i.status}</Badge>
                    </div>
                    <p className="mt-1 text-[13px] text-slate-500">{i.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Dados de demonstração" description="Este ambiente usa dados fictícios armazenados no navegador." />
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Database className="h-4 w-4 text-slate-400" /> Restaura lojas, preços, campanhas, alertas e auditoria ao estado inicial.
          </p>
          <Button variant="outline" onClick={() => setResetOpen(true)}>
            <RotateCcw /> Restaurar dados
          </Button>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        danger
        title="Restaurar dados de demonstração?"
        description="Todas as alterações feitas nesta demonstração serão descartadas."
        confirmLabel="Restaurar"
        onConfirm={() => settingsService.resetDemo()}
      />
    </div>
  );
}
