import { AuditAction, PriceChangeStatus, type PriceChange } from '@/types';
import { formatCurrency } from '@/utils/format';
import { hasPermission } from '@/utils/permissions';
import { uid } from '@/utils/time';
import { auditService } from './audit.service';
import { catalogService } from './catalog.service';
import { db } from './collections';
import { delay } from './db';
import { notificationsService } from './notifications.service';
import { currentActor, firstName } from './session';

export interface PriceChangeInput {
  productId: string;
  storeId: string | 'all';
  newPrice: number;
  startAt?: string;
  endAt?: string;
  reason?: string;
  source?: PriceChange['source'];
}

function storeLabel(storeId: string | 'all') {
  return storeId === 'all' ? 'todas as lojas' : db.stores.get(storeId)?.name ?? storeId;
}

export function needsApproval(currentPrice: number, newPrice: number, storeId: string | 'all') {
  const settings = db.settings.get();
  if (!settings.requireManagerApproval) return false;
  const variation = Math.abs(((newPrice - currentPrice) / currentPrice) * 100);
  return variation >= settings.approvalThresholdPct || storeId === 'all';
}

function publishOne(change: PriceChange, actorName: string): PriceChange {
  catalogService.applyPrice(change.productId, change.storeId, change.newPrice);
  const product = db.products.get(change.productId);
  auditService.log({
    action: AuditAction.AlteracaoPreco,
    summary: `${firstName(actorName)} alterou o preço de ${product?.shortName ?? change.productId}`,
    previousValue: formatCurrency(change.currentPrice),
    newValue: formatCurrency(change.newPrice),
    storeId: change.storeId === 'all' ? undefined : change.storeId,
  });
  return db.prices.upsert({ ...change, status: PriceChangeStatus.Publicado });
}

export const pricesService = {
  list: () => delay(db.prices.all()),

  create(input: PriceChangeInput, submit = false): PriceChange {
    const actor = currentActor();
    const current = catalogService.effectivePrice(input.productId, input.storeId === 'all' ? undefined : input.storeId).price;
    const requiresApproval = needsApproval(current, input.newPrice, input.storeId);
    const change: PriceChange = {
      id: uid('pc'),
      productId: input.productId,
      storeId: input.storeId,
      currentPrice: current,
      newPrice: input.newPrice,
      startAt: input.startAt ?? new Date().toISOString(),
      endAt: input.endAt,
      status: submit ? (requiresApproval ? PriceChangeStatus.AguardandoAprovacao : PriceChangeStatus.Aprovado) : PriceChangeStatus.Rascunho,
      requestedBy: actor.name,
      createdAt: new Date().toISOString(),
      reason: input.reason ?? 'Alteração manual',
      requiresApproval,
      source: input.source ?? 'manual',
    };
    return db.prices.upsert(change);
  },

  async createMany(inputs: PriceChangeInput[], submit = false) {
    const created = inputs.map((i) => this.create(i, submit));
    auditService.log({
      action: AuditAction.AlteracaoPreco,
      summary: `${firstName(currentActor().name)} criou ${created.length} alterações de preço (${inputs[0]?.source ?? 'manual'})`,
      newValue: submit ? 'Enviado para aprovação' : 'Rascunho',
    });
    return delay(created, 300);
  },

  async submit(ids: string[]) {
    ids.forEach((id) => {
      const c = db.prices.get(id);
      if (!c || c.status !== PriceChangeStatus.Rascunho) return;
      db.prices.upsert({ ...c, status: c.requiresApproval ? PriceChangeStatus.AguardandoAprovacao : PriceChangeStatus.Aprovado });
    });
    return delay(true, 250);
  },

  async approve(ids: string[]) {
    const actor = currentActor();
    ids.forEach((id) => {
      const c = db.prices.get(id);
      if (!c || ![PriceChangeStatus.AguardandoAprovacao, PriceChangeStatus.Rascunho].includes(c.status)) return;
      db.prices.upsert({ ...c, status: PriceChangeStatus.Aprovado, approvedBy: actor.name });
      const product = db.products.get(c.productId);
      auditService.log({
        action: AuditAction.AprovacaoPreco,
        summary: `${firstName(actor.name)} aprovou alteração de preço de ${product?.shortName}`,
        previousValue: formatCurrency(c.currentPrice),
        newValue: formatCurrency(c.newPrice),
        storeId: c.storeId === 'all' ? undefined : c.storeId,
      });
    });
    return delay(true, 300);
  },

  async reject(ids: string[]) {
    const actor = currentActor();
    ids.forEach((id) => {
      const c = db.prices.get(id);
      if (!c) return;
      db.prices.upsert({ ...c, status: PriceChangeStatus.Rejeitado, approvedBy: actor.name });
    });
    auditService.log({ action: AuditAction.AprovacaoPreco, summary: `${firstName(actor.name)} rejeitou ${ids.length} alteração(ões) de preço`, newValue: 'Rejeitado' });
    return delay(true, 250);
  },

  async schedule(ids: string[], startAt: string) {
    ids.forEach((id) => {
      const c = db.prices.get(id);
      if (!c) return;
      db.prices.upsert({ ...c, startAt, status: c.status === PriceChangeStatus.Aprovado ? PriceChangeStatus.Agendado : c.status });
    });
    return delay(true, 250);
  },

  /** Publica somente itens aprovados/agendados. Retorna quantidade publicada. */
  async publish(ids: string[]) {
    const actor = currentActor();
    const eligible = ids
      .map((id) => db.prices.get(id))
      .filter((c): c is PriceChange => !!c && [PriceChangeStatus.Aprovado, PriceChangeStatus.Agendado].includes(c.status));
    await delay(null, 900);
    eligible.forEach((c) => publishOne(c, actor.name));
    if (eligible.length) {
      const shelves = eligible.reduce((acc, c) => acc + db.shelves.all().filter((s) => (c.storeId === 'all' || s.storeId === c.storeId) && s.published.slots.some((sl) => sl.productId === c.productId)).length, 0);
      notificationsService.push({
        title: `${eligible.length} preço(s) publicado(s)`,
        description: `${shelves} réguas atualizadas · ${storeLabel(eligible[0].storeId)}${eligible.length > 1 ? ' e outras' : ''}`,
        link: '/precos',
        tone: 'success',
      });
    }
    return { published: eligible.length, skipped: ids.length - eligible.length };
  },

  /** Usado pelo editor de régua: publica direto quando permitido ou envia para aprovação. */
  publishFromShelf(productId: string, storeId: string, newPrice: number) {
    const actor = currentActor();
    const current = catalogService.effectivePrice(productId, storeId).price;
    if (Math.abs(current - newPrice) < 0.001) return null;
    const requiresApproval = needsApproval(current, newPrice, storeId);
    const canApprove = hasPermission(actor.role, 'prices.approve');
    const change: PriceChange = {
      id: uid('pc'),
      productId,
      storeId,
      currentPrice: current,
      newPrice,
      startAt: new Date().toISOString(),
      status: PriceChangeStatus.Aprovado,
      requestedBy: actor.name,
      approvedBy: requiresApproval && canApprove ? actor.name : undefined,
      createdAt: new Date().toISOString(),
      reason: 'Alteração pelo editor de régua',
      requiresApproval,
      source: 'regua',
    };
    if (requiresApproval && !canApprove) {
      return db.prices.upsert({ ...change, status: PriceChangeStatus.AguardandoAprovacao });
    }
    return publishOne(change, actor.name);
  },

  remove(id: string) {
    db.prices.remove(id);
  },

  /** Processa agendamentos vencidos (em produção: job no backend). */
  processScheduled() {
    const now = Date.now();
    db.prices
      .all()
      .filter((c) => c.status === PriceChangeStatus.Agendado && new Date(c.startAt).getTime() <= now)
      .forEach((c) => publishOne(c, 'Sistema'));
  },
};
