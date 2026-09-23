import { CalendarClock, ChevronLeft, ChevronRight, Eye, Plus, Save, Send, Undo2, Wand2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PublishDialog, type PublishPhase } from '@/components/shelf/PublishDialog';
import { ShelfPreviewDialog } from '@/components/shelf/ShelfPreviewDialog';
import { ShelfStrip } from '@/components/shelf/ShelfStrip';
import { SlotInspector } from '@/components/shelf/SlotInspector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Switch } from '@/components/ui/form';
import { SegmentedControl, Skeleton } from '@/components/ui/misc';
import { Dialog, MenuItem, Popover } from '@/components/ui/overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usePriceBook } from '@/hooks/usePriceBook';
import { useQuery } from '@/hooks/useQuery';
import { needsApproval, settingsService, shelvesService, type PublishResult } from '@/services';
import { ContentStatus, DeviceStatus, type ShelfSlot } from '@/types';
import { cn } from '@/utils/cn';
import { atDayOffset } from '@/utils/time';
import { formatCurrency, formatDateTime, formatRelative, toDateTimeLocal } from '@/utils/format';
import { CONTENT_STATUS, DEVICE_STATUS } from '@/utils/labels';
import { clampOffset, isAligned, layoutsEqual, maxWidthFor, slotBounds, sortSlots, swapWithNeighbor } from '@/utils/shelf';

export default function ShelfEditorPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const { data, loading } = useQuery(() => shelvesService.get(id), [id]);
  const book = usePriceBook(data?.store.id);
  const settings = settingsService.getSync();

  const [slots, setSlots] = useState<ShelfSlot[]>([]);
  const [history, setHistory] = useState<ShelfSlot[][]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState<'5' | '10' | '50'>('10');
  const [showFacings, setShowFacings] = useState(true);
  const [loadedId, setLoadedId] = useState<string>();
  const [preview, setPreview] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(toDateTimeLocal(atDayOffset(1, 6)));
  const [cancelOpen, setCancelOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [phase, setPhase] = useState<PublishPhase>('confirm');
  const [result, setResult] = useState<PublishResult>();
  const [saving, setSaving] = useState(false);
  const dragSnapshot = useRef<ShelfSlot[]>([]);

  const readOnly = !can('shelves.edit');
  const shelf = data?.shelf;
  const baseSlots = useMemo(() => shelf?.draft?.slots ?? shelf?.published.slots ?? [], [shelf]);

  // Carrega o layout ao abrir outra régua.
  useEffect(() => {
    if (shelf && loadedId !== shelf.id) {
      setSlots(sortSlots(baseSlots));
      setHistory([]);
      setPrices({});
      setSelectedId(baseSlots.find((s) => s.kind === 'product')?.id ?? null);
      setLoadedId(shelf.id);
    }
  }, [shelf, baseSlots, loadedId]);

  const dirty = !!shelf && (!layoutsEqual(slots, baseSlots) || Object.keys(prices).length > 0);
  const unpublished = !!shelf && (!layoutsEqual(slots, shelf.published.slots) || Object.keys(prices).length > 0);
  const selected = slots.find((s) => s.id === selectedId);
  const stepMm = Number(step);

  const commit = useCallback(
    (next: ShelfSlot[], record = true) => {
      if (record) setHistory((h) => [...h.slice(-30), slots]);
      setSlots(next);
    },
    [slots],
  );

  const patchSlot = (slotId: string, patch: Partial<ShelfSlot>) => {
    if (!shelf) return;
    commit(
      slots.map((s) => {
        if (s.id !== slotId) return s;
        const next = { ...s, ...patch };
        if (patch.widthMm !== undefined) next.widthMm = Math.min(patch.widthMm, maxWidthFor(slots, slotId, shelf.widthMm));
        return next;
      }),
    );
  };

  const nudge = useCallback(
    (direction: -1 | 1) => {
      if (!shelf || !selected) return;
      const target = clampOffset(slots, selected.id, selected.offsetMm + direction * stepMm, shelf.widthMm);
      if (target === selected.offsetMm) {
        toast.info('Limite atingido', 'O bloco encostou no vizinho ou na extremidade da régua. Use “Trocar com…” para inverter a ordem.');
        return;
      }
      commit(slots.map((s) => (s.id === selected.id ? { ...s, offsetMm: target } : s)));
    },
    [shelf, selected, slots, stepMm, commit, toast],
  );

  const alignSelected = () => {
    if (!shelf || !selected?.productId) return;
    const facing = shelf.facings.find((f) => f.productId === selected.productId);
    if (!facing) return;
    const ideal = facing.offsetMm + facing.widthMm / 2 - selected.widthMm / 2;
    const target = clampOffset(slots, selected.id, ideal, shelf.widthMm);
    commit(slots.map((s) => (s.id === selected.id ? { ...s, offsetMm: target } : s)));
    if (Math.abs(target - ideal) > 15) toast.info('Alinhamento parcial', 'Um bloco vizinho impede o alinhamento total. Ajuste a largura ou mova o vizinho.');
  };

  const alignAll = () => {
    if (!shelf) return;
    let next = sortSlots(slots);
    next.forEach((slot) => {
      if (slot.kind !== 'product' || !slot.productId) return;
      const facing = shelf.facings.find((f) => f.productId === slot.productId);
      if (!facing) return;
      const ideal = facing.offsetMm + facing.widthMm / 2 - slot.widthMm / 2;
      const target = clampOffset(next, slot.id, ideal, shelf.widthMm);
      next = next.map((s) => (s.id === slot.id ? { ...s, offsetMm: target } : s));
    });
    commit(next);
    toast.success('Preços alinhados', 'Blocos reposicionados abaixo dos produtos detectados na prateleira.');
  };

  const addBlock = (kind: 'badge' | 'message') => {
    if (!shelf) return;
    const width = kind === 'badge' ? 120 : 220;
    const sorted = sortSlots(slots);
    let offset: number | null = null;
    let cursor = 0;
    for (const s of [...sorted, { offsetMm: shelf.widthMm, widthMm: 0 } as ShelfSlot]) {
      if (s.offsetMm - cursor >= width) {
        offset = cursor;
        break;
      }
      cursor = s.offsetMm + s.widthMm;
    }
    if (offset === null) {
      toast.error('Sem espaço livre na régua', 'Reduza a largura de algum bloco para inserir um novo elemento.');
      return;
    }
    const newSlot: ShelfSlot = {
      id: `${shelf.id}-n${Date.now().toString(36)}`,
      kind,
      text: kind === 'badge' ? 'OFERTA' : 'CONFIRA',
      offsetMm: offset,
      widthMm: width,
      align: 'center',
      highlight: kind === 'badge' ? 'promo' : 'none',
      showPreviousPrice: false,
    };
    commit(sortSlots([...slots, newSlot]));
    setSelectedId(newSlot.id);
  };

  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setSlots(prev);
    setHistory((h) => h.slice(0, -1));
  };

  // Atalhos: setas movem o bloco selecionado; Ctrl+Z desfaz.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || readOnly) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        nudge(e.key === 'ArrowLeft' ? -1 : 1);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (loading) return <PageSkeleton />;
  if (!data || !shelf)
    return (
      <Card>
        <EmptyState title="Régua não encontrada" action={<Link to="/reguas"><Button variant="outline">Voltar para réguas</Button></Link>} />
      </Card>
    );

  const { gondola, store, siblings } = data;
  const offline = shelf.status === DeviceStatus.Offline;
  const misaligned = slots.filter((s) => !isAligned(s, shelf.facings)).length;
  const idx = siblings.findIndex((s) => s.id === shelf.id);
  const prevShelf = siblings[idx - 1];
  const nextShelf = siblings[idx + 1];

  const priceEntries = Object.entries(prices).filter(([pid, v]) => Math.abs(v - (book.prices[pid]?.price ?? 0)) > 0.001);
  const approvals = priceEntries.filter(([pid, v]) => needsApproval(book.prices[pid]?.price ?? v, v, store.id) && !can('prices.approve')).length;
  const movedCount = slots.filter((s) => {
    const p = shelf.published.slots.find((b) => b.id === s.id);
    return !p || JSON.stringify(p) !== JSON.stringify(s);
  }).length;

  const saveDraft = async () => {
    setSaving(true);
    await shelvesService.saveDraft(shelf.id, slots);
    setSaving(false);
    setHistory([]);
    toast.success('Rascunho salvo', `Régua ${shelf.code} · as alterações ainda não estão visíveis na loja.`);
  };

  const doPublish = async () => {
    setPhase('publishing');
    const toastId = toast.loading('Publicando…', `Régua ${shelf.code}`);
    try {
      const res = await shelvesService.publish(shelf.id, slots, Object.fromEntries(priceEntries));
      setResult(res);
      setPrices({});
      setHistory([]);
      setPhase('done');
      toast.update(toastId, { tone: 'success', title: 'Publicado com sucesso', description: `Régua ${shelf.code} · ${store.name}` });
      if (res.pendingApproval) toast.info('Aprovação necessária', `${res.pendingApproval} alteração(ões) de preço enviadas ao gerente da loja.`);
    } catch (e) {
      toast.update(toastId, { tone: 'error', title: 'Falha na publicação', description: (e as Error).message });
      setPublishOpen(false);
    }
  };

  const doSchedule = async () => {
    const at = new Date(scheduleAt);
    if (Number.isNaN(at.getTime()) || at.getTime() < Date.now()) {
      toast.error('Data inválida', 'Informe uma data e hora futuras para a publicação.');
      return;
    }
    await shelvesService.schedule(shelf.id, slots, at.toISOString());
    setScheduleOpen(false);
    setHistory([]);
    toast.success('Publicação agendada', `Régua ${shelf.code} será atualizada em ${formatDateTime(at.toISOString())}.`);
  };

  const doCancel = async () => {
    await shelvesService.discardDraft(shelf.id);
    setSlots(sortSlots(shelf.published.slots));
    setPrices({});
    setHistory([]);
    setCancelOpen(false);
    toast.info('Alterações canceladas', 'A régua voltou para a versão publicada.');
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Lojas', to: '/lojas' },
          { label: store.name, to: `/lojas/${store.id}` },
          { label: `Gôndola ${gondola.code}`, to: `/gondolas/${gondola.id}` },
          { label: `Régua ${shelf.code}` },
        ]}
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            Régua {shelf.code}
            <span className="text-base font-normal text-slate-500">
              Loja {store.name} · Corredor {gondola.aisle}
            </span>
          </span>
        }
        meta={
          <>
            <StatusBadge map={DEVICE_STATUS} value={shelf.status} />
            <StatusBadge map={CONTENT_STATUS} value={shelf.contentStatus} dot={false} />
            {shelf.contentStatus === ContentStatus.Agendado && shelf.scheduledAt && <Badge tone="violet">Publica em {formatDateTime(shelf.scheduledAt)}</Badge>}
            {dirty && <Badge tone="amber" dot>Alterações não salvas</Badge>}
            <span className="text-[13px] text-slate-500">
              Publicada {formatRelative(shelf.published.updatedAt)} por {shelf.published.updatedBy} · Prateleira {shelf.level} de {siblings.length}
            </span>
          </>
        }
        actions={
          <>
            <div className="flex items-center rounded-md border border-slate-200 bg-white">
              <Button variant="ghost" size="icon-sm" disabled={!prevShelf} onClick={() => prevShelf && navigate(`/reguas/${prevShelf.id}/editor`)} aria-label="Régua anterior" title="Prateleira abaixo">
                <ChevronLeft />
              </Button>
              <Button variant="ghost" size="icon-sm" disabled={!nextShelf} onClick={() => nextShelf && navigate(`/reguas/${nextShelf.id}/editor`)} aria-label="Próxima régua" title="Prateleira acima">
                <ChevronRight />
              </Button>
            </div>
            <Button variant="outline" onClick={() => setPreview(true)}>
              <Eye /> Pré-visualizar
            </Button>
          </>
        }
      />

      {readOnly && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Seu perfil possui acesso somente leitura a esta régua.</div>
      )}
      {offline && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Régua sem comunicação desde {formatDateTime(shelf.lastHeartbeatAt)}. Publicações ficarão na fila até a reconexão.{' '}
          <Link to="/operacoes" className="font-medium underline">Ver chamados</Link>
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-slate-500">Passo</span>
            <SegmentedControl
              size="sm"
              value={step}
              onChange={setStep}
              items={[
                { value: '5', label: '5 mm' },
                { value: '10', label: '10 mm' },
                { value: '50', label: '50 mm' },
              ]}
            />
          </div>
          <label className="ml-2 flex items-center gap-2 text-[13px] text-slate-600">
            <Switch checked={showFacings} onChange={setShowFacings} label="Exibir produtos" /> Produtos na prateleira
          </label>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {misaligned > 0 ? <Badge tone="amber" dot>{misaligned} preço(s) desalinhado(s)</Badge> : <Badge tone="green" dot>Todos os preços alinhados</Badge>}
            <Button variant="outline" size="sm" onClick={alignAll} disabled={readOnly || misaligned === 0}>
              <Wand2 /> Alinhar todos
            </Button>
            <Popover
              align="end"
              trigger={({ toggle }) => (
                <Button variant="outline" size="sm" onClick={toggle} disabled={readOnly}>
                  <Plus /> Inserir
                </Button>
              )}
            >
              {(close) => (
                <div className="p-1.5">
                  <MenuItem onClick={() => { addBlock('badge'); close(); }}>Selo “OFERTA”</MenuItem>
                  <MenuItem onClick={() => { addBlock('message'); close(); }}>Mensagem de texto</MenuItem>
                </div>
              )}
            </Popover>
            <Button variant="ghost" size="sm" onClick={undo} disabled={history.length === 0} title="Desfazer (Ctrl+Z)">
              <Undo2 /> Desfazer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px]">
          <div className="min-w-0 border-slate-100 xl:border-r">
            <div className="overflow-x-auto px-4 pb-2 pt-5">
              <div className="min-w-[720px]">
                {!book.ready ? (
                  <Skeleton className="h-40" />
                ) : (
                  <ShelfStrip
                    widthMm={shelf.widthMm}
                    slots={slots}
                    facings={shelf.facings}
                    showFacings={showFacings}
                    showGuides
                    showRuler
                    products={book.products}
                    prices={book.prices}
                    priceOverrides={prices}
                    selectedId={selectedId}
                    onSelect={(slotId) => {
                      dragSnapshot.current = slots;
                      setSelectedId(slotId);
                    }}
                    onDrag={
                      readOnly
                        ? undefined
                        : (slotId, offset) => {
                            setSlots((curr) => curr.map((s) => (s.id === slotId ? { ...s, offsetMm: clampOffset(curr, slotId, offset, shelf.widthMm) } : s)));
                          }
                    }
                    onDragEnd={() => setHistory((h) => [...h.slice(-30), dragSnapshot.current])}
                    offline={false}
                  />
                )}
              </div>
            </div>
            <p className="px-4 pb-3 text-xs text-slate-500">
              Selecione um bloco para editar. Arraste horizontalmente ou use “Mover para esquerda/direita” para posicionar o preço exatamente abaixo do produto.
            </p>

            <div className="border-t border-slate-100">
              <CardHeader title="Blocos da régua" description={`${slots.length} elementos · comprimento de ${shelf.widthMm} mm`} className="border-0 pb-2" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50/70 text-left text-xs text-slate-500">
                      <th className="px-4 py-2 font-medium">#</th>
                      <th className="px-4 py-2 font-medium">Elemento</th>
                      <th className="px-4 py-2 text-right font-medium">Preço</th>
                      <th className="px-4 py-2 text-right font-medium">Posição</th>
                      <th className="px-4 py-2 text-right font-medium">Largura</th>
                      <th className="px-4 py-2 font-medium">Alinhamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((s, i) => {
                      const p = s.productId ? book.products[s.productId] : undefined;
                      const newP = s.productId ? prices[s.productId] : undefined;
                      const aligned = isAligned(s, shelf.facings);
                      const b = slotBounds(slots, s.id, shelf.widthMm);
                      return (
                        <tr
                          key={s.id}
                          onClick={() => setSelectedId(s.id)}
                          className={cn('cursor-pointer border-b border-slate-100 transition-colors last:border-0', s.id === selectedId ? 'bg-brand-50/60' : 'hover:bg-slate-50')}
                        >
                          <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                          <td className="px-4 py-2">
                            <span className="font-medium text-slate-900">{p?.shortName ?? s.text}</span>
                            {s.highlight === 'promo' && <Badge tone="red" className="ml-2">Promoção</Badge>}
                            {s.highlight === 'destaque' && <Badge tone="amber" className="ml-2">Destaque</Badge>}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {p ? (
                              newP !== undefined ? (
                                <span>
                                  <span className="text-slate-400 line-through">{formatCurrency(book.prices[p.id]?.price)}</span>{' '}
                                  <span className="font-medium text-brand-700">{formatCurrency(newP)}</span>
                                </span>
                              ) : (
                                formatCurrency(book.prices[p.id]?.price)
                              )
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-right font-mono text-[13px] tabular-nums text-slate-600" title={`Livre entre ${b.min} e ${b.max} mm`}>
                            {s.offsetMm} mm
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-right font-mono text-[13px] tabular-nums text-slate-600">{s.widthMm} mm</td>
                          <td className="px-4 py-2">
                            {s.kind !== 'product' ? <span className="text-slate-400">—</span> : aligned ? <Badge tone="green">Alinhado</Badge> : <Badge tone="amber">Desalinhado</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="border-t border-slate-100 xl:border-t-0">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Propriedades</p>
              {selected && (
                <button onClick={() => setSelectedId(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fechar painel">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {selected ? (
              <SlotInspector
                slot={selected}
                product={selected.productId ? book.products[selected.productId] : undefined}
                price={selected.productId ? book.prices[selected.productId] : undefined}
                newPrice={selected.productId ? prices[selected.productId] : undefined}
                facings={shelf.facings}
                maxWidth={maxWidthFor(slots, selected.id, shelf.widthMm)}
                step={stepMm}
                readOnly={readOnly}
                approvalThreshold={settings.requireManagerApproval && !can('prices.approve') ? settings.approvalThresholdPct : null}
                onChange={(patch) => patchSlot(selected.id, patch)}
                onNudge={nudge}
                onSwap={(dir) => commit(swapWithNeighbor(slots, selected.id, dir))}
                onAlign={alignSelected}
                onPrice={(value) => {
                  if (!selected.productId) return;
                  const pid = selected.productId;
                  setPrices((curr) => {
                    const next = { ...curr };
                    if (value === undefined) delete next[pid];
                    else next[pid] = value;
                    return next;
                  });
                }}
                onRemove={() => {
                  commit(slots.filter((s) => s.id !== selected.id));
                  setSelectedId(null);
                }}
              />
            ) : (
              <EmptyState title="Nenhum bloco selecionado" description="Clique em um produto na régua para editar preço, posição e aparência." />
            )}
          </aside>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50/70 px-4 py-3">
          <span className="text-[13px] text-slate-500">
            {unpublished ? `${movedCount} bloco(s) e ${priceEntries.length} preço(s) diferentes da versão publicada` : 'Régua sincronizada com a versão publicada'}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => setCancelOpen(true)} disabled={readOnly || (!unpublished && shelf.contentStatus === ContentStatus.Publicado)}>
              Cancelar alteração
            </Button>
            <Button variant="outline" onClick={saveDraft} loading={saving} disabled={readOnly || !dirty}>
              <Save /> Salvar rascunho
            </Button>
            <Button variant="outline" onClick={() => setScheduleOpen(true)} disabled={readOnly || !can('shelves.publish') || !unpublished}>
              <CalendarClock /> Agendar publicação
            </Button>
            <Button
              onClick={() => {
                setPhase('confirm');
                setPublishOpen(true);
              }}
              disabled={readOnly || !can('shelves.publish') || !unpublished}
            >
              <Send /> Publicar
            </Button>
          </div>
        </div>
      </Card>

      <ShelfPreviewDialog
        open={preview}
        onClose={() => setPreview(false)}
        title={`Régua ${shelf.code}`}
        widthMm={shelf.widthMm}
        slots={slots}
        publishedSlots={shelf.published.slots}
        facings={shelf.facings}
        products={book.products}
        prices={book.prices}
        priceOverrides={prices}
      />

      <PublishDialog
        open={publishOpen}
        phase={phase}
        onClose={() => setPublishOpen(false)}
        onConfirm={doPublish}
        shelfCode={shelf.code}
        offline={offline}
        result={result}
        summary={{ moved: movedCount, prices: priceEntries.length, approvals, blocks: slots.length }}
      />

      <Dialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Agendar publicação"
        description={`O conteúdo será enviado para a régua ${shelf.code} na data escolhida.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Voltar
            </Button>
            <Button onClick={doSchedule}>
              <CalendarClock /> Agendar
            </Button>
          </>
        }
      >
        <Field label="Data e hora" htmlFor="schedule-at" hint={`Janela de publicação da rede: ${settings.publicationWindowStart} às ${settings.publicationWindowEnd}.`}>
          <Input id="schedule-at" type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
        </Field>
        {priceEntries.length > 0 && (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
            As alterações de preço não entram no agendamento do layout. Publique-as agora ou agende pela Central de preços.
          </p>
        )}
      </Dialog>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={doCancel}
        danger
        title="Cancelar alterações?"
        description="O rascunho e as alterações não publicadas desta régua serão descartados. Esta ação não pode ser desfeita."
        confirmLabel="Descartar alterações"
      />
    </div>
  );
}
