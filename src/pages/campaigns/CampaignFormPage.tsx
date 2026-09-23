import { Check, Pause, Play, Save, Search, Send, Square } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PROMO_BG, ShelfStrip, type PriceInfo } from '@/components/shelf/ShelfStrip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CAMPAIGN_TYPE_LABEL } from '@/data/campaigns';
import { BRANDS } from '@/data/products';
import { useQuery } from '@/hooks/useQuery';
import { campaignsService, catalogService, settingsService, storesService, type CampaignInput } from '@/services';
import { CampaignStatus, CampaignType, type Campaign, type CampaignColor, type CampaignLayout, type Product, type ShelfSlot } from '@/types';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDate, normalize, toDateInput } from '@/utils/format';
import { CAMPAIGN_STATUS } from '@/utils/labels';
import { daysFromNow } from '@/utils/time';

const LAYOUTS: { value: CampaignLayout; label: string; description: string }[] = [
  { value: 'preco_selo', label: 'Preço + selo', description: 'Selo de oferta ao lado do preço promocional' },
  { value: 'de_por', label: 'De / por', description: 'Exibe o preço anterior riscado' },
  { value: 'faixa', label: 'Faixa completa', description: 'Mensagem em destaque ocupando a régua' },
  { value: 'selo_lateral', label: 'Selo lateral', description: 'Mensagem curta e preço em destaque' },
];

const COLORS: { value: CampaignColor; label: string }[] = [
  { value: 'vermelho', label: 'Vermelho' },
  { value: 'azul', label: 'Azul' },
  { value: 'grafite', label: 'Grafite' },
  { value: 'verde', label: 'Verde' },
  { value: 'amarelo', label: 'Amarelo' },
];

const emptyForm = (): CampaignInput => ({
  name: '',
  type: CampaignType.PrecoPromocional,
  brand: 'Renata',
  productIds: [],
  storeIds: ['lj001'],
  startDate: new Date().toISOString(),
  endDate: daysFromNow(7),
  startTime: '07:00',
  endTime: '22:00',
  layout: 'preco_selo',
  message: '',
  priority: 'media',
  color: 'vermelho',
  discountPct: 10,
  status: CampaignStatus.Rascunho,
});

/** Monta os blocos de preview da régua a partir do layout escolhido. */
function buildPreview(form: CampaignInput, products: Product[]): ShelfSlot[] {
  const items = products.slice(0, form.layout === 'preco_selo' ? 3 : 2);
  const slots: ShelfSlot[] = [];
  let cursor = 20;
  const msg = (form.message || CAMPAIGN_TYPE_LABEL[form.type]).toUpperCase();
  if (form.layout === 'faixa') {
    slots.push({ id: 'msg', kind: 'message', text: msg.slice(0, 32), offsetMm: cursor, widthMm: 640, align: 'center', highlight: 'promo', showPreviousPrice: false });
    cursor += 660;
  }
  if (form.layout === 'selo_lateral') {
    slots.push({ id: 'badge', kind: 'badge', text: msg.split(' ').slice(0, 2).join(' ').slice(0, 14), offsetMm: cursor, widthMm: 360, align: 'center', highlight: 'promo', showPreviousPrice: false });
    cursor += 380;
  }
  const width = Math.floor((1480 - cursor) / Math.max(1, items.length + (form.layout === 'preco_selo' ? 0.4 : 0)));
  items.forEach((p, i) => {
    if (form.layout === 'preco_selo' && i === 0) {
      slots.push({ id: 'selo', kind: 'badge', text: 'OFERTA', offsetMm: cursor, widthMm: 190, align: 'center', highlight: 'promo', showPreviousPrice: false });
      cursor += 200;
    }
    slots.push({
      id: `p-${p.id}`,
      kind: 'product',
      productId: p.id,
      offsetMm: cursor,
      widthMm: Math.min(width - 10, 1500 - cursor),
      align: 'center',
      highlight: form.layout === 'selo_lateral' ? 'destaque' : 'promo',
      showPreviousPrice: form.layout === 'de_por',
    });
    cursor += width;
  });
  return slots.filter((s) => s.offsetMm + s.widthMm <= 1500);
}

export default function CampaignFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const { data: existing, loading } = useQuery(() => (id ? campaignsService.get(id) : Promise.resolve(undefined)), [id]);
  const products = catalogService.listSync();
  const stores = storesService.listSync();
  const settings = settingsService.getSync();
  const [form, setForm] = useState<CampaignInput>(emptyForm);
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (existing && !loaded) {
      const { id: cid, name, type, brand, productIds, storeIds, startDate, endDate, startTime, endTime, layout, message, priority, color, discountPct, status } = existing;
      setForm({ id: cid, name, type, brand, productIds, storeIds, startDate, endDate, startTime, endTime, layout, message, priority, color, discountPct, status });
      setLoaded(true);
    }
  }, [existing, loaded]);

  const set = <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const brandProducts = products.filter((p) => p.brand === form.brand && p.status !== 'inativo' && (!productSearch || normalize(p.shortName).includes(normalize(productSearch))));
  const selectedProducts = products.filter((p) => form.productIds.includes(p.id));
  const reach = useMemo(() => campaignsService.estimateReach(form), [form]);

  const previewPrices = useMemo(() => {
    const map: Record<string, PriceInfo> = {};
    const byId: Record<string, Product> = {};
    products.forEach((p) => {
      byId[p.id] = p;
      const eff = catalogService.effectivePrice(p.id);
      map[p.id] = { ...eff, promoPrice: form.discountPct > 0 ? Math.round(eff.price * (1 - form.discountPct / 100) * 100) / 100 : eff.promoPrice ?? eff.price };
    });
    return { map, byId };
  }, [products, form.discountPct]);

  const previewSlots = useMemo(() => buildPreview(form, selectedProducts.length ? selectedProducts : brandProducts.slice(0, 3)), [form, selectedProducts, brandProducts]);

  if (!isNew && loading) return <PageSkeleton />;
  if (!isNew && !existing)
    return (
      <Card>
        <EmptyState title="Campanha não encontrada" action={<Link to="/campanhas"><Button variant="outline">Voltar</Button></Link>} />
      </Card>
    );

  const errors: string[] = [];
  if (!form.name.trim()) errors.push('Informe o nome da campanha.');
  if (!form.productIds.length) errors.push('Selecione ao menos um produto.');
  if (!form.storeIds.length) errors.push('Selecione ao menos uma loja.');
  if (new Date(form.endDate) < new Date(form.startDate)) errors.push('A data final deve ser posterior à inicial.');

  const needsApproval = settings.approvalForCampaigns && !can('campaigns.approve');
  const startsInFuture = new Date(form.startDate).setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0);

  const save = async (status: CampaignStatus, key: string, message: string) => {
    if (status !== CampaignStatus.Rascunho && errors.length) {
      toast.error('Revise o formulário', errors[0]);
      return;
    }
    if (!form.name.trim()) {
      toast.error('Revise o formulário', 'Informe o nome da campanha.');
      return;
    }
    setSaving(key);
    const t = status === CampaignStatus.Ativa ? toast.loading('Publicando…', `${reach} réguas serão atualizadas`) : undefined;
    const saved = await campaignsService.save({ ...form, status });
    setSaving(null);
    if (t) toast.update(t, { tone: 'success', title: 'Publicado com sucesso', description: `${saved.name} · ${reach} réguas atualizadas` });
    else toast.success(message, saved.name);
    navigate(`/campanhas/${saved.id}`, { replace: true });
    setLoaded(false);
  };

  const setStatus = async (status: CampaignStatus, msg: string) => {
    if (!existing) return;
    setSaving(status);
    await campaignsService.setStatus(existing.id, status);
    setSaving(null);
    setForm((f) => ({ ...f, status }));
    toast.success(msg, existing.name);
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Campanhas', to: '/campanhas' }, { label: isNew ? 'Nova campanha' : existing!.name }]}
        title={isNew ? 'Nova campanha' : existing!.name}
        meta={
          !isNew && existing ? (
            <>
              <StatusBadge map={CAMPAIGN_STATUS} value={existing.status} />
              <span className="text-[13px] text-slate-500">
                Criada por {existing.createdBy} em {formatDate(existing.createdAt)}
                {existing.approvedBy && ` · aprovada por ${existing.approvedBy}`}
              </span>
            </>
          ) : undefined
        }
        actions={
          existing && (
            <>
              {existing.status === CampaignStatus.AguardandoAprovacao && can('campaigns.approve') && (
                <Button loading={saving === CampaignStatus.Ativa} onClick={() => setStatus(startsInFuture ? CampaignStatus.Agendada : CampaignStatus.Ativa, 'Campanha aprovada')}>
                  <Check /> Aprovar e publicar
                </Button>
              )}
              {existing.status === CampaignStatus.Ativa && (
                <Button variant="outline" loading={saving === CampaignStatus.Pausada} onClick={() => setStatus(CampaignStatus.Pausada, 'Campanha pausada')}>
                  <Pause /> Pausar
                </Button>
              )}
              {existing.status === CampaignStatus.Pausada && (
                <Button variant="outline" loading={saving === CampaignStatus.Ativa} onClick={() => setStatus(CampaignStatus.Ativa, 'Campanha retomada')}>
                  <Play /> Retomar
                </Button>
              )}
              {[CampaignStatus.Ativa, CampaignStatus.Pausada, CampaignStatus.Agendada].includes(existing.status) && (
                <Button variant="outline" onClick={() => setConfirmEnd(true)}>
                  <Square /> Encerrar
                </Button>
              )}
            </>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_440px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Identificação" />
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nome da campanha" htmlFor="c-name" className="sm:col-span-2">
                <Input id="c-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Semana Selmi" />
              </Field>
              <Field label="Tipo de campanha">
                <Select value={form.type} onChange={(e) => set('type', e.target.value as CampaignType)}>
                  {Object.values(CampaignType).map((t) => (
                    <option key={t} value={t}>
                      {CAMPAIGN_TYPE_LABEL[t]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Marca">
                <Select
                  value={form.brand}
                  onChange={(e) => {
                    set('brand', e.target.value);
                    set('productIds', []);
                  }}
                >
                  {BRANDS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Mensagem" className="sm:col-span-2" hint={`${form.message.length}/48 caracteres · exibida conforme o layout escolhido`}>
                <Textarea rows={2} maxLength={48} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Ex.: Massas Renata com preço especial" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Produtos" description={`${form.productIds.length} selecionado(s) da marca ${form.brand}`} actions={<Button variant="ghost" size="sm" onClick={() => set('productIds', brandProducts.map((p) => p.id))}>Selecionar todos</Button>} />
            <CardContent>
              <Input icon={<Search />} placeholder="Filtrar produtos" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
              <div className="mt-3 grid max-h-[260px] grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
                {brandProducts.map((p) => {
                  const checked = form.productIds.includes(p.id);
                  return (
                    <label key={p.id} className={cn('flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors', checked ? 'border-brand-200 bg-brand-50/50' : 'border-slate-200 hover:bg-slate-50')}>
                      <Checkbox checked={checked} onChange={(c) => set('productIds', c ? [...form.productIds, p.id] : form.productIds.filter((x) => x !== p.id))} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-slate-900">{p.shortName}</span>
                        <span className="text-xs text-slate-500">{formatCurrency(p.price)}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Lojas"
              description={`${form.storeIds.length} de ${stores.length} lojas`}
              actions={
                <>
                  <Button variant="ghost" size="sm" onClick={() => set('storeIds', stores.map((s) => s.id))}>
                    Todas
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => set('storeIds', [])}>
                    Nenhuma
                  </Button>
                </>
              }
            />
            <CardContent className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((s) => (
                <Checkbox
                  key={s.id}
                  checked={form.storeIds.includes(s.id)}
                  onChange={(c) => set('storeIds', c ? [...form.storeIds, s.id] : form.storeIds.filter((x) => x !== s.id))}
                  label={<span className="text-[13px]">{s.name}</span>}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Período e exibição" />
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Data inicial">
                <Input type="date" value={toDateInput(form.startDate)} onChange={(e) => e.target.value && set('startDate', new Date(`${e.target.value}T00:00`).toISOString())} />
              </Field>
              <Field label="Data final">
                <Input type="date" value={toDateInput(form.endDate)} onChange={(e) => e.target.value && set('endDate', new Date(`${e.target.value}T00:00`).toISOString())} />
              </Field>
              <Field label="Horário inicial">
                <Input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
              </Field>
              <Field label="Horário final">
                <Input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
              </Field>
              <Field label="Desconto (%)" hint="0 usa o preço promocional do cadastro">
                <Input type="number" min={0} max={80} value={form.discountPct} onChange={(e) => set('discountPct', Math.max(0, Math.min(80, Number(e.target.value))))} />
              </Field>
              <Field label="Prioridade" hint="Resolve conflitos entre campanhas">
                <Select value={form.priority} onChange={(e) => set('priority', e.target.value as Campaign['priority'])}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </Select>
              </Field>
              <Field label="Status" className="sm:col-span-2">
                <Select value={form.status} onChange={(e) => set('status', e.target.value as CampaignStatus)}>
                  {Object.values(CampaignStatus).map((s) => (
                    <option key={s} value={s} disabled={(s === CampaignStatus.Ativa || s === CampaignStatus.Agendada) && needsApproval}>
                      {CAMPAIGN_STATUS[s].label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="mb-2 text-[13px] font-medium text-slate-700">Layout</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {LAYOUTS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => set('layout', l.value)}
                      className={cn('rounded-md border px-3 py-2.5 text-left transition-colors', form.layout === l.value ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-600' : 'border-slate-200 hover:bg-slate-50')}
                    >
                      <p className="text-sm font-medium text-slate-900">{l.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{l.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="mb-2 text-[13px] font-medium text-slate-700">Cor</p>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set('color', c.value)}
                      className={cn('inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[13px] transition-colors', form.color === c.value ? 'border-slate-900 text-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
                    >
                      <span className={cn('h-3.5 w-3.5 rounded-sm', PROMO_BG[c.value])} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="space-y-4 xl:sticky xl:top-20">
            <Card>
              <CardHeader title="Preview da régua" description="Simulação com os produtos selecionados" />
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[360px]">
                    <ShelfStrip widthMm={1500} slots={previewSlots} products={previewPrices.byId} prices={previewPrices.map} size="lg" promoColor={form.color} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Régua de 1.500 mm · cores e textos conforme o layout.</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Réguas impactadas</dt>
                    <dd className="text-lg font-semibold tabular-nums text-slate-900">{reach}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Lojas</dt>
                    <dd className="text-lg font-semibold tabular-nums text-slate-900">{form.storeIds.length}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Período</dt>
                    <dd>
                      {formatDate(form.startDate)} – {formatDate(form.endDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Horário</dt>
                    <dd>
                      {form.startTime} às {form.endTime}
                    </dd>
                  </div>
                </dl>
                {selectedProducts.length > 0 && (
                  <ul className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-[13px]">
                    {selectedProducts.slice(0, 6).map((p) => (
                      <li key={p.id} className="flex justify-between gap-2">
                        <span className="truncate text-slate-600">{p.shortName}</span>
                        <span className="shrink-0 tabular-nums">
                          <span className="text-slate-400 line-through">{formatCurrency(previewPrices.map[p.id]?.price)}</span>{' '}
                          <span className="font-medium text-red-700">{formatCurrency(previewPrices.map[p.id]?.promoPrice)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                {errors.length > 0 && (
                  <ul className="space-y-1 rounded-md bg-slate-50 px-3 py-2 text-[13px] text-slate-600">
                    {errors.map((e) => (
                      <li key={e}>• {e}</li>
                    ))}
                  </ul>
                )}
                {needsApproval && <Badge tone="amber">Publicação requer aprovação de gerente</Badge>}
                <div className="flex flex-col gap-2">
                  <Button variant="outline" loading={saving === 'draft'} disabled={!can('campaigns.edit')} onClick={() => save(CampaignStatus.Rascunho, 'draft', 'Rascunho salvo')}>
                    <Save /> Salvar rascunho
                  </Button>
                  {needsApproval ? (
                    <Button loading={saving === 'approval'} disabled={!can('campaigns.edit')} onClick={() => save(CampaignStatus.AguardandoAprovacao, 'approval', 'Enviada para aprovação')}>
                      <Send /> Enviar para aprovação
                    </Button>
                  ) : (
                    <Button
                      loading={saving === 'publish'}
                      disabled={!can('campaigns.edit')}
                      onClick={() => save(startsInFuture ? CampaignStatus.Agendada : CampaignStatus.Ativa, 'publish', startsInFuture ? 'Campanha agendada' : 'Campanha publicada')}
                    >
                      <Send /> {startsInFuture ? 'Agendar publicação' : 'Publicar campanha'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        danger
        title="Encerrar campanha?"
        description="As réguas voltarão a exibir o preço regular. A campanha não poderá ser reativada."
        confirmLabel="Encerrar campanha"
        onConfirm={async () => {
          setConfirmEnd(false);
          await setStatus(CampaignStatus.Encerrada, 'Campanha encerrada');
        }}
      />
    </div>
  );
}
