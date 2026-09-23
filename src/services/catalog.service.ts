import { AuditAction, type Product } from '@/types';
import { formatCurrency } from '@/utils/format';
import { auditService } from './audit.service';
import { db } from './collections';
import { delay } from './db';

export interface EffectivePrice {
  price: number;
  previousPrice: number;
  promoPrice?: number;
}

export const catalogService = {
  list: () => delay(db.products.all()),
  listSync: () => db.products.all(),
  get: (id: string) => delay(db.products.get(id)),

  update(id: string, changes: Partial<Product>) {
    const before = db.products.get(id);
    const updated = db.products.update(id, changes);
    if (before && updated && changes.promoPrice !== undefined && changes.promoPrice !== before.promoPrice) {
      auditService.log({
        action: AuditAction.AlteracaoPreco,
        summary: `Preço promocional de ${updated.shortName} atualizado`,
        previousValue: formatCurrency(before.promoPrice),
        newValue: formatCurrency(updated.promoPrice),
      });
    }
    return delay(updated, 200);
  },

  /** Preço vigente de um produto em uma loja (considera publicações por loja). */
  effectivePrice(productId: string, storeId?: string): EffectivePrice {
    const product = db.products.get(productId);
    if (!product) return { price: 0, previousPrice: 0 };
    const sp = storeId ? db.storePrices.get(`${storeId}:${productId}`) : undefined;
    return {
      price: sp?.price ?? product.price,
      previousPrice: sp?.previousPrice ?? product.previousPrice,
      promoPrice: product.promoPrice,
    };
  },

  /** Aplica um preço publicado. storeId "all" altera o preço base da rede. */
  applyPrice(productId: string, storeId: string | 'all', newPrice: number) {
    const product = db.products.get(productId);
    if (!product) return;
    if (storeId === 'all') {
      db.products.update(productId, { previousPrice: product.price, price: newPrice });
      return;
    }
    const current = this.effectivePrice(productId, storeId);
    db.storePrices.upsert({
      id: `${storeId}:${productId}`,
      storeId,
      productId,
      price: newPrice,
      previousPrice: current.price,
      updatedAt: new Date().toISOString(),
    });
  },
};
