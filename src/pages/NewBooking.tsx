import { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Lock, MapPin, Search, Sparkles } from 'lucide-react';
import { useApp } from '../store';
import { ACTION_TYPES, MATERIAIS, OUTRA, TYPE_DESC, UF } from '../data/catalog';
import { checkSlot, dayInfo, nextAvailableDate, type DayState } from '../lib/availability';
import { dayNum, fmtBR, fmtLong, fromMin, monthCells, toMin } from '../lib/dates';
import { Badge, Button, Card, Field, Modal, StatusBadge, cn, inputCls, textareaCls, KV, Segmented } from '../components/ui';
import { MonthHeader, WeekdayRow } from '../components/CalendarView';

const STEPS = ['Cliente', 'Data', 'Ação', 'Confirmação'];
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const DAY_STYLE: Record<DayState, string> = {
  disponivel: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400',
  poucas: 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400',
  indisponivel: 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-400',
  passada: 'border-slate-100 bg-slate-100 text-slate-400',
  antecedencia: 'border-slate-100 bg-slate-100 text-slate-400',
};
const DAY_LABEL: Record<DayState, string> = { disponivel: 'DISPONÍVEL', poucas: 'POUCAS VAGAS', indisponivel: 'INDISPONÍVEL', passada: 'DATA PASSADA', antecedencia: 'FORA DA ANTECEDÊNCIA MÍNIMA' };
const DAY_BADGE: Record<DayState, string> = {
  disponivel: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  poucas: 'bg-amber-50 text-amber-800 ring-amber-200',
  indisponivel: 'bg-rose-50 text-rose-700 ring-rose-200',
  passada: 'bg-slate-100 text-slate-600 ring-slate-200',
  antecedencia: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function NewBooking() {
  const a = useApp();
  const { data, tastings, settings, role, me, today, createTasting, nav, openDetail } = a;
  const [step, setStep] = useState(0);
  const [codcli, setCodcli] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<'meus' | 'todos'>(role === 'vendedor' ? 'meus' : 'todos');
  const [date, setDate] = useState<string | null>(null);
  const [ym, setYm] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('13:00');
  const [dur, setDur] = useState<string>('4');
  const [tipoId, setTipoId] = useState('');
  const [tipoOutro, setTipoOutro] = useState('');
  const [brandId, setBrandId] = useState('');
  const [marcaOutra, setMarcaOutra] = useState('');
  const [produtoOutro, setProdutoOutro] = useState('');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [materiais, setMateriais] = useState<string[]>([]);
  const [obs, setObs] = useState('');
  const [done, setDone] = useState<string | null>(null);

  const client = data.clients.find((c) => c.codcli === codcli);
  const opStart = toMin(settings.operacaoInicio);
  const opEnd = toMin(settings.operacaoFim);
  const hours = (from: number, to: number) => { const r: string[] = []; for (let m = from; m <= to; m += 30) r.push(fromMin(m)); return r; };

  const list = useMemo(() => {
    const term = norm(q.trim());
    const digits = q.replace(/\D/g, '');
    return data.clients
      .filter((c) => (scope === 'meus' && role === 'vendedor' ? c.vendedorId === me.id : true))
      .filter((c) => !term || norm(`${c.codcli} ${c.razao} ${c.fantasia} ${c.cidade} ${c.bairro} ${c.rede}`).includes(term) || (digits.length >= 3 && c.cnpj.replace(/\D/g, '').includes(digits)))
      .sort((x, y) => Number(y.ativo) - Number(x.ativo) || x.fantasia.localeCompare(y.fantasia));
  }, [q, scope, data.clients, role, me.id]);

  const info = date ? dayInfo(date, tastings, data.promoters, settings) : null;
  const dayOk = info && (info.state === 'disponivel' || info.state === 'poucas');
  const timeValid = toMin(end) > toMin(start);
  const slot = date && codcli && dayOk && timeValid ? checkSlot(date, start, end, codcli, tastings, data.promoters) : null;
  const step2ok = !!slot?.ok;

  const brand = data.brands.find((b) => b.id === brandId);
  const brandProducts = data.products.filter((p) => p.brandId === brandId && p.ativo);
  const step3ok = !!tipoId && (tipoId !== 'outro' || !!tipoOutro.trim()) && !!brandId && (brandId === OUTRA ? !!marcaOutra.trim() && !!produtoOutro.trim() : productIds.length > 0);
  const can = [!!client, step2ok, step3ok, true][step];

  const setDuration = (d: string, s = start) => {
    setDur(d);
    if (d === 'dia') { setStart(settings.operacaoInicio); setEnd('18:00'); return; }
    const e = toMin(s) + Number(d) * 60;
    setEnd(fromMin(Math.min(e, opEnd)));
  };
  const setStartTime = (s: string) => {
    setStart(s);
    if (dur !== 'custom' && dur !== 'dia') setEnd(fromMin(Math.min(toMin(s) + Number(dur) * 60, opEnd)));
    else if (toMin(end) <= toMin(s)) setEnd(fromMin(Math.min(toMin(s) + 120, opEnd)));
  };

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const pickBrand = (id: string) => { setBrandId(id); setProductIds([]); };
  const typeName = tipoId === 'outro' && tipoOutro ? `Outro — ${tipoOutro}` : ACTION_TYPES.find((t) => t.id === tipoId)?.nome;

  const cells = monthCells(ym.y, ym.m);

  const confirm = () => {
    const t = createTasting({ codcli: codcli!, date: date!, start, end, tipoId, tipoOutro: tipoOutro.trim() || undefined, brandId, marcaOutra: marcaOutra.trim() || undefined, productIds, produtoOutro: produtoOutro.trim() || undefined, materiais, obs: obs.trim() });
    setDone(t.id);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Novo agendamento de degustação</h1>
        <p className="mt-1 text-sm text-slate-500">Siga as etapas para enviar a solicitação à gestora de promotores.</p>
      </div>

      <ol className="mb-6 grid grid-cols-4 gap-2 sm:gap-3">
        {STEPS.map((s, i) => (
          <li key={s} className="min-w-0">
            <div className={cn('h-1 rounded-full', i <= step ? 'bg-accent-500' : 'bg-slate-200')} />
            <div className="mt-2 flex items-center gap-2">
              <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', i < step ? 'bg-accent-500 text-white' : i === step ? 'bg-navy-900 text-white' : 'bg-slate-200 text-slate-500')}>
                {i < step ? <Check size={12} /> : i + 1}
              </span>
              <span className={cn('truncate text-xs font-semibold sm:text-sm', i === step ? 'text-navy-900' : 'text-slate-400')}>{s}</span>
            </div>
          </li>
        ))}
      </ol>

      {/* ETAPA 1 — CLIENTE */}
      {step === 0 && (
        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Escolher cliente</h2>
            <p className="text-sm text-slate-500">Selecione um cliente da base cadastrada. Os dados são carregados automaticamente.</p>
          </div>
          {client ? (
            <div className="p-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 size={17} /> Cliente selecionado</div>
                  <Button size="sm" variant="secondary" onClick={() => { setCodcli(null); setDate(null); }}>Trocar cliente</Button>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {([['CODCLI', client.codcli], ['Razão Social', client.razao], ['CNPJ', client.cnpj], ['Nome fantasia', client.fantasia], ['Cidade', `${client.cidade} - ${UF}`], ['Bairro', client.bairro], ['Endereço', client.endereco], ['Rede', client.rede]] as const).map(([l, v]) => (
                    <Field key={l} label={l}>
                      <div className="relative">
                        <input className={cn(inputCls, 'pr-9')} value={v} readOnly disabled />
                        <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </Field>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><Lock size={12} /> Dados provenientes da base de clientes — não editáveis pelo vendedor. Vendedor responsável: {a.sellerName(client.vendedorId)}.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input autoFocus className={cn(inputCls, 'h-11 pl-10')} placeholder="Buscar cliente… (código, razão social, fantasia, cidade, bairro ou CNPJ)" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                {role === 'vendedor' && (
                  <Segmented value={scope} onChange={setScope} options={[{ value: 'meus', label: 'Minha carteira' }, { value: 'todos', label: 'Todos' }]} />
                )}
              </div>
              <ul className="scroll-thin max-h-[460px] divide-y divide-slate-100 overflow-y-auto">
                {list.length === 0 && <li className="px-5 py-12 text-center text-sm text-slate-500">Nenhum cliente encontrado para “{q}”.</li>}
                {list.map((c) => (
                  <li key={c.codcli} className={cn('flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center', !c.ativo && 'bg-slate-50 opacity-70')}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">{c.codcli}</span>
                        {!c.ativo && <Badge className="bg-slate-100 text-slate-600 ring-slate-200">INATIVO</Badge>}
                        {c.vendedorId !== me.id && role === 'vendedor' && <Badge className="bg-navy-50 text-navy-600 ring-navy-200">OUTRA CARTEIRA</Badge>}
                      </div>
                      <p className="mt-0.5 font-semibold uppercase tracking-tight">{c.fantasia}</p>
                      <p className="truncate text-xs text-slate-500">{c.razao} · CNPJ {c.cnpj}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin size={13} className="shrink-0 text-slate-400" /> {c.cidade} - {UF} · {c.endereco}</p>
                      <p className="text-xs text-slate-500">Vendedor: {a.sellerName(c.vendedorId)} · Rede {c.rede}</p>
                    </div>
                    <Button variant={c.ativo ? 'dark' : 'secondary'} disabled={!c.ativo} onClick={() => { setCodcli(c.codcli); setDate(null); }}>Selecionar</Button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">{list.length} {list.length === 1 ? 'cliente' : 'clientes'} exibidos</div>
            </>
          )}
        </Card>
      )}

      {/* ETAPA 2 — DATA */}
      {step === 1 && client && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Card className="p-4 sm:p-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Escolha a data da degustação</h2>
              <Button size="sm" variant="secondary" onClick={() => { const d = nextAvailableDate(tastings, data.promoters, settings); setDate(d); setYm({ y: Number(d.slice(0, 4)), m: Number(d.slice(5, 7)) - 1 }); }}>
                <Sparkles size={14} /> Próxima data disponível
              </Button>
            </div>
            <p className="mb-4 text-xs text-slate-500">Antecedência mínima de {settings.minLeadDays} dias para novos agendamentos.</p>
            <MonthHeader year={ym.y} month={ym.m} onChange={(y, m) => setYm({ y, m })} />
            <WeekdayRow />
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {cells.map((iso, i) => {
                if (!iso) return <div key={i} />;
                const di = dayInfo(iso, tastings, data.promoters, settings);
                return (
                  <button
                    key={iso}
                    onClick={() => setDate(iso)}
                    title={DAY_LABEL[di.state]}
                    className={cn('flex aspect-square items-center justify-center rounded-lg border text-sm font-semibold transition sm:aspect-[5/4]', DAY_STYLE[di.state], date === iso && 'ring-2 ring-navy-900 ring-offset-1')}
                  >
                    {dayNum(iso)}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
              {[['bg-emerald-400', 'Disponível'], ['bg-amber-400', 'Poucas vagas'], ['bg-rose-400', 'Indisponível'], ['bg-slate-300', 'Data passada / fora da antecedência']].map(([c, l]) => (
                <span key={l} className="inline-flex items-center gap-1.5"><span className={cn('h-2.5 w-2.5 rounded-sm', c)} />{l}</span>
              ))}
            </div>
          </Card>

          <Card className="self-start">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cliente</p>
              <p className="text-sm font-semibold">{client.fantasia}</p>
            </div>
            {!date || !info ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">Selecione um dia no calendário para consultar a disponibilidade.</div>
            ) : (
              <div className="space-y-5 p-5">
                <div>
                  <p className="text-lg font-bold">{fmtBR(date)}</p>
                  <p className="text-sm text-slate-500">{fmtLong(date).split(',')[0]}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Disponibilidade</p>
                  {info.state === 'passada' || info.state === 'antecedencia' ? (
                    <p className="text-sm text-slate-600">{info.state === 'passada' ? 'Esta data já passou.' : `Fora da antecedência mínima de ${settings.minLeadDays} dias.`}</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      <li><b>{info.available}</b> {info.available === 1 ? 'promotor disponível' : 'promotores disponíveis'}</li>
                      <li><b>{info.booked}</b> {info.booked === 1 ? 'degustação agendada' : 'degustações agendadas'}</li>
                      {info.motivo && <li className="text-xs text-slate-500">{info.motivo}</li>}
                    </ul>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-sm"><span className="text-slate-500">Situação:</span><Badge className={DAY_BADGE[info.state]}>{DAY_LABEL[info.state]}</Badge></div>
                </div>

                {dayOk && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Horário inicial">
                        <select className={inputCls} value={start} onChange={(e) => setStartTime(e.target.value)}>
                          {hours(opStart, opEnd - 60).map((h) => <option key={h}>{h}</option>)}
                        </select>
                      </Field>
                      <Field label="Horário final">
                        <select className={inputCls} value={end} onChange={(e) => { setEnd(e.target.value); setDur('custom'); }}>
                          {hours(toMin(start) + 60, opEnd).map((h) => <option key={h}>{h}</option>)}
                        </select>
                      </Field>
                    </div>
                    <div>
                      <span className="mb-1.5 block text-xs font-semibold text-navy-700">Duração</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[['2', '2 horas'], ['4', '4 horas'], ['6', '6 horas'], ['dia', 'Dia inteiro']].map(([v, l]) => (
                          <button key={v} onClick={() => setDuration(v)} className={cn('rounded-lg border px-1 py-2 text-xs font-semibold transition', dur === v ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 hover:bg-slate-50')}>{l}</button>
                        ))}
                      </div>
                    </div>
                    {!timeValid && <Alert tone="rose">O horário final deve ser posterior ao inicial.</Alert>}
                    {slot && !slot.ok && <Alert tone="rose">{slot.message}</Alert>}
                    {slot?.ok && <Alert tone="emerald">Horário livre: {slot.freeCount} {slot.freeCount === 1 ? 'promotor disponível' : 'promotores disponíveis'} das {start} às {end}.</Alert>}
                  </div>
                )}
                {info.state === 'indisponivel' && <Alert tone="rose">Não há disponibilidade operacional para esta data.</Alert>}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ETAPA 3 — AÇÃO */}
      {step === 2 && (
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-semibold">Tipo de ação</h2>
            <p className="mb-4 text-sm text-slate-500">Escolha o tipo principal da ação.</p>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {data.types.filter((t) => t.ativo).map((t) => (
                <button key={t.id} onClick={() => setTipoId(t.id)} className={cn('flex items-start gap-3 rounded-xl border p-3.5 text-left transition', tipoId === t.id ? 'border-accent-500 bg-accent-50/60 ring-1 ring-accent-500' : 'border-slate-200 hover:bg-slate-50')}>
                  <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', tipoId === t.id ? 'border-accent-500 bg-accent-500 text-white' : 'border-slate-300')}>{tipoId === t.id && <Check size={10} strokeWidth={3} />}</span>
                  <span><span className="block text-sm font-semibold">{t.nome}</span><span className="text-xs text-slate-500">{TYPE_DESC[t.id] ?? 'Tipo personalizado'}</span></span>
                </button>
              ))}
            </div>
            {tipoId === 'outro' && <Field label="Descreva o tipo de ação" className="mt-4 max-w-md"><input className={inputCls} value={tipoOutro} onChange={(e) => setTipoOutro(e.target.value)} placeholder="Ex.: Ação de receitas com chef convidado" /></Field>}
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Marca e produtos</h2>
            <p className="mb-4 text-sm text-slate-500">Depois de escolher a marca, selecione um ou mais produtos.</p>
            <div className="flex flex-wrap gap-2">
              {[...data.brands.filter((b) => b.ativo), { id: OUTRA, nome: 'Outra', ativo: true }].map((b) => (
                <button key={b.id} onClick={() => pickBrand(b.id)} className={cn('rounded-full border px-4 py-2 text-sm font-semibold transition', brandId === b.id ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 hover:bg-slate-50')}>{b.nome}</button>
              ))}
            </div>
            {brandId === OUTRA && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Nome da marca"><input className={inputCls} value={marcaOutra} onChange={(e) => setMarcaOutra(e.target.value)} /></Field>
                <Field label="Produto"><input className={inputCls} value={produtoOutro} onChange={(e) => setProdutoOutro(e.target.value)} /></Field>
              </div>
            )}
            {brand && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Produtos {brand.nome}</span>
                  <button className="text-xs font-semibold text-accent-600 hover:underline" onClick={() => setProductIds(productIds.length === brandProducts.length ? [] : brandProducts.map((p) => p.id))}>
                    {productIds.length === brandProducts.length ? 'Limpar seleção' : 'Selecionar todos'}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {brandProducts.map((p) => {
                    const on = productIds.includes(p.id);
                    return (
                      <label key={p.id} className={cn('flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition', on ? 'border-accent-500 bg-accent-50/60' : 'border-slate-200 hover:bg-slate-50')}>
                        <input type="checkbox" className="h-4 w-4 accent-accent-500" checked={on} onChange={() => toggle(productIds, p.id, setProductIds)} />
                        {p.nome}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Materiais necessários <span className="text-sm font-normal text-slate-400">(opcional)</span></h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {MATERIAIS.map((m) => {
                const on = materiais.includes(m);
                return (
                  <label key={m} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition', on ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 hover:bg-slate-50')}>
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(materiais, m, setMateriais)} />
                    {on && <Check size={14} />}{m}
                  </label>
                );
              })}
            </div>
            <Field label="Observações da ação" className="mt-5">
              <textarea className={textareaCls} rows={3} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Exemplo: Cliente solicitou montagem próxima à entrada da loja." />
            </Field>
          </Card>
        </div>
      )}

      {/* ETAPA 4 — CONFIRMAÇÃO */}
      {step === 3 && client && date && (
        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Resumo da solicitação</h2>
            <p className="text-sm text-slate-500">Confira os dados antes de enviar à gestora de promotores.</p>
          </div>
          <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
            <KV label="Cliente">{client.fantasia}<span className="block text-xs font-normal text-slate-500">CODCLI {client.codcli} · {client.cidade} - {UF}</span></KV>
            <KV label="Data">{fmtBR(date)}<span className="block text-xs font-normal text-slate-500">{fmtLong(date).split(',')[0]}</span></KV>
            <KV label="Horário">{start} às {end}</KV>
            <KV label="Tipo">{typeName}</KV>
            <KV label="Marca">{brandId === OUTRA ? marcaOutra : brand?.nome}</KV>
            <KV label="Produto">{brandId === OUTRA ? produtoOutro : productIds.map((id) => data.products.find((p) => p.id === id)?.nome).join(' · ')}</KV>
            <div className="sm:col-span-2"><KV label="Materiais">{materiais.length ? materiais.join(' · ') : 'Nenhum material solicitado'}</KV></div>
            <div className="sm:col-span-2"><KV label="Observações">{obs || 'Sem observações.'}</KV></div>
          </dl>
          <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-sm text-slate-600 sm:rounded-b-xl">
            Status inicial após o envio: <StatusBadge status="AGUARDANDO_PROMOTOR" />
          </div>
        </Card>
      )}

      <div className="sticky bottom-0 -mx-4 mt-6 flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-white sm:px-5">
        <Button variant="ghost" onClick={() => (step === 0 ? nav('dashboard') : setStep(step - 1))}><ArrowLeft size={16} /> {step === 0 ? 'Cancelar' : 'Voltar'}</Button>
        {step < 3 ? (
          <Button variant="dark" size="lg" disabled={!can} onClick={() => setStep(step + 1)}>Continuar <ArrowRight size={16} /></Button>
        ) : (
          <Button variant="primary" size="lg" onClick={confirm}><Check size={17} /> CONFIRMAR SOLICITAÇÃO</Button>
        )}
      </div>

      <Modal
        open={!!done}
        onClose={() => {}}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => nav('dashboard')}>Ir ao dashboard</Button>
            <Button variant="primary" onClick={() => { const id = done!; nav('agendamentos'); openDetail(id); }}>Ver agendamento</Button>
          </>
        }
      >
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={30} /></span>
          <h3 className="mt-4 text-lg font-bold">Solicitação realizada com sucesso.</h3>
          <p className="mt-1 text-sm text-slate-500">{done} · {client?.fantasia} · {date && fmtBR(date)}</p>
          <div className="mt-4"><Badge className="bg-amber-50 text-amber-800 ring-amber-200"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />AGUARDANDO DEFINIÇÃO DO PROMOTOR</Badge></div>
          <p className="mt-4 text-xs text-slate-500">A gestora de promotores foi notificada e definirá o responsável pela ação.</p>
        </div>
      </Modal>
    </div>
  );
}

function Alert({ tone, children }: { tone: 'rose' | 'emerald'; children: React.ReactNode }) {
  return (
    <div className={cn('flex gap-2.5 rounded-lg border p-3 text-sm', tone === 'rose' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>
      {tone === 'rose' ? <AlertCircle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}


