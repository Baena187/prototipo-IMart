import { useMemo } from 'react';
import type { PriceInfo } from '@/components/shelf/ShelfStrip';
import { catalogService, db } from '@/services';
import type { Product } from '@/types';
import { useQuery } from './useQuery';

/** Catálogo + preços vigentes de uma loja, indexados por produto. */
export function usePriceBook(storeId: string | undefined) {
  const { data: products } = useQuery(() => catalogService.list(), []);
  const { data: storePrices } = useQuery(() => Promise.resolve(db.storePrices.all()), []);
  return useMemo(() => {
    const byId: Record<string, Product> = {};
    const prices: Record<string, PriceInfo> = {};
    (products ?? []).forEach((p) => {
      byId[p.id] = p;
      prices[p.id] = catalogService.effectivePrice(p.id, storeId);
    });
    return { products: byId, prices, ready: !!products };
    // storePrices entra como dependência para recalcular após publicações
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, storePrices, storeId]);
}
