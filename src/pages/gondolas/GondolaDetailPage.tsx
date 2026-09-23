import { Cctv, Pencil, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { KeyValueList } from '@/components/shared/KeyValue';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ShelfStrip } from '@/components/shelf/ShelfStrip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/contexts/ToastContext';
import { usePriceBook } from '@/hooks/usePriceBook';
import { useQuery } from '@/hooks/useQuery';
import { gondolasService } from '@/services';
import { ContentStatus, DeviceStatus } from '@/types';
import { cn } from '@/utils/cn';
import { formatRelative } from '@/utils/format';
import { CONTENT_STATUS, DEVICE_STATUS } from '@/utils/labels';
import { isAligned } from '@/utils/shelf';

export default function GondolaDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading } = useQuery(() => gondolasService.get(id), [id]);
  const book = usePriceBook(data?.store.id);

  if (loading) return <PageSkeleton />;
  if (!data)
    return (
      <Card>
        <EmptyState title="Gôndola não encontrada" action={<Link to="/gondolas"><Button variant="outline">Voltar</Button></Link>} />
      </Card>
    );

  const { gondola, store, shelves, cameras } = data;
  const productIds = Array.from(new Set(shelves.flatMap((s) => s.facings.map((f) => f.productId))));
  const misaligned = shelves.reduce((acc, s) => acc + s.published.slots.filter((sl) => !isAligned(sl, s.facings)).length, 0);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Gôndolas', to: '/gondolas' }, { label: store.name, to: `/lojas/${store.id}` }, { label: `Gôndola ${gondola.code}` }]}
        title={`Gôndola ${gondola.code}`}
        meta={
          <>
            <StatusBadge map={DEVICE_STATUS} value={gondola.status} />
            <Badge tone="outline">Corredor {gondola.aisleNumber} · {gondola.aisle}</Badge>
            <span className="text-[13px] text-slate-500">Sincronizada {formatRelative(gondola.lastSyncAt)}</span>
          </>
        }
        actions={
          <Button variant="outline" onClick={() => toast.success('Sincronização solicitada', `Controlador da gôndola ${gondola.code} confirmou o recebimento.`)}>
            <RefreshCw /> Sincronizar
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader
            title="Representação da gôndola"
            description="Cada linha representa uma prateleira com sua régua digital. Clique para abrir o editor."
            actions={misaligned > 0 ? <Badge tone="amber" dot>{misaligned} preços desalinhados</Badge> : <Badge tone="green" dot>Preços alinhados</Badge>}
          />
          <CardContent className="bg-slate-50/60">
            <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-inner">
              <div className="space-y-3">
                {shelves.map((shelf) => {
                  const off = shelf.status === DeviceStatus.Offline;
                  const shelfMis = shelf.published.slots.filter((sl) => !isAligned(sl, shelf.facings)).length;
                  return (
                    <button
                      key={shelf.id}
                      onClick={() => navigate(`/reguas/${shelf.id}/editor`)}
                      className="group block w-full rounded-md p-1.5 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center gap-2 px-0.5">
                        <span className="font-mono text-xs font-semibold text-slate-700">{shelf.code}</span>
                        <span className="text-xs text-slate-400">Prateleira {shelf.level}</span>
                        <StatusBadge map={DEVICE_STATUS} value={shelf.status} className="text-[11px]" />
                        {shelf.contentStatus !== ContentStatus.Publicado && <StatusBadge map={CONTENT_STATUS} value={shelf.contentStatus} className="text-[11px]" />}
                        {shelfMis > 0 && <span className="text-[11px] font-medium text-amber-700">{shelfMis} desalinhado(s)</span>}
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brand-700 opacity-0 transition-opacity group-hover:opacity-100">
                          <Pencil className="h-3 w-3" /> Editar régua
                        </span>
                      </div>
                      {/* produtos físicos */}
                      <div className="relative h-7 border-x border-t border-slate-200 bg-slate-50">
                        {shelf.facings.map((f) => (
                          <div
                            key={f.productId}
                            className="absolute bottom-0 h-6 rounded-t-sm border border-black/10"
                            style={{ left: `${(f.offsetMm / shelf.widthMm) * 100}%`, width: `${(f.widthMm / shelf.widthMm) * 100}%`, backgroundColor: book.products[f.productId]?.color, opacity: 0.85 }}
                            title={book.products[f.productId]?.shortName}
                          />
                        ))}
                      </div>
                      <ShelfStrip widthMm={shelf.widthMm} slots={shelf.published.slots} products={book.products} prices={book.prices} size="sm" offline={off} className={cn(!book.ready && 'opacity-0')} />
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 h-3 rounded-b bg-slate-300" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Dados da gôndola" />
            <CardContent>
              <KeyValueList
                columns={1}
                items={[
                  { label: 'Loja', value: <Link className="text-brand-700 hover:underline" to={`/lojas/${store.id}`}>{store.name}</Link> },
                  { label: 'Categoria', value: gondola.category },
                  { label: 'Prateleiras / réguas', value: `${gondola.shelfCount} prateleiras · ${shelves.length} réguas` },
                  { label: 'Comprimento útil', value: `${gondola.widthMm} mm` },
                  { label: 'Controlador', value: <span className="font-mono text-[13px]">CTL-{store.code.slice(3)}-G{gondola.code.slice(2)}</span> },
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Câmeras relacionadas" />
            <ul className="divide-y divide-slate-100">
              {cameras.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <Cctv className="h-4 w-4 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{c.code}</p>
                    <p className="text-xs text-slate-500">
                      {c.ruptureCount} ruptura(s) · {c.misplacedCount} fora de posição
                    </p>
                  </div>
                  <StatusBadge map={DEVICE_STATUS} value={c.status} />
                </li>
              ))}
              {cameras.length === 0 && <li className="px-5 py-6 text-center text-sm text-slate-500">Nenhuma câmera nesta gôndola.</li>}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Produtos na gôndola" description={`${productIds.length} SKUs`} />
            <ul className="max-h-[280px] divide-y divide-slate-100 overflow-y-auto">
              {productIds.map((pid) => {
                const p = book.products[pid];
                if (!p) return null;
                return (
                  <li key={pid}>
                    <Link to={`/produtos?produto=${pid}`} className="flex items-center gap-2 px-5 py-2 text-sm hover:bg-slate-50">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                      <span className="flex-1 truncate text-slate-700">{p.shortName}</span>
                      <span className="tabular-nums text-slate-900">R$ {book.prices[pid]?.price.toFixed(2).replace('.', ',')}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
