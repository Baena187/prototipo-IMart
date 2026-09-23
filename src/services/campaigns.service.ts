import { AuditAction, CampaignStatus, type Campaign } from '@/types';
import { uid } from '@/utils/time';
import { auditService } from './audit.service';
import { db } from './collections';
import { delay } from './db';
import { notificationsService } from './notifications.service';
import { currentActor, firstName } from './session';

export type CampaignInput = Omit<Campaign, 'id' | 'createdBy' | 'createdAt' | 'reach' | 'approvedBy'> & { id?: string };

function estimateReach(c: Pick<Campaign, 'productIds' | 'storeIds'>) {
  const shelves = db.shelves
    .all()
    .filter((s) => c.storeIds.includes(s.storeId) && s.published.slots.some((sl) => sl.productId && c.productIds.includes(sl.productId))).length;
  return shelves;
}

export const campaignsService = {
  list: () => delay(db.campaigns.all()),
  get: (id: string) => delay(db.campaigns.get(id)),
  estimateReach,

  async save(input: CampaignInput): Promise<Campaign> {
    const actor = currentActor();
    const existing = input.id ? db.campaigns.get(input.id) : undefined;
    const reachShelves = estimateReach(input);
    const campaign: Campaign = {
      ...input,
      id: existing?.id ?? uid('cp'),
      createdBy: existing?.createdBy ?? actor.name,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      approvedBy: existing?.approvedBy,
      reach: existing?.reach ?? { shelves: input.status === CampaignStatus.Ativa ? reachShelves : 0, impressions: 0 },
    };
    if (campaign.status === CampaignStatus.Ativa) campaign.reach = { ...campaign.reach, shelves: reachShelves };
    db.campaigns.upsert(campaign);
    auditService.log({
      action: AuditAction.CriacaoCampanha,
      summary: `${firstName(actor.name)} ${existing ? 'editou' : 'criou'} a campanha ${campaign.name}`,
      previousValue: existing ? existing.status : undefined,
      newValue: campaign.status,
    });
    return delay(campaign, 500);
  },

  async setStatus(id: string, status: CampaignStatus) {
    const actor = currentActor();
    const c = db.campaigns.get(id);
    if (!c) return;
    const approving = c.status === CampaignStatus.AguardandoAprovacao && [CampaignStatus.Ativa, CampaignStatus.Agendada].includes(status);
    const updated: Campaign = {
      ...c,
      status,
      approvedBy: approving ? actor.name : c.approvedBy,
      reach: status === CampaignStatus.Ativa ? { ...c.reach, shelves: estimateReach(c) } : c.reach,
    };
    if (status === CampaignStatus.Ativa) await delay(null, 900);
    db.campaigns.upsert(updated);
    auditService.log({
      action: approving ? AuditAction.AprovacaoCampanha : AuditAction.CriacaoCampanha,
      summary: approving ? `${firstName(actor.name)} aprovou campanha ${c.name}` : `${firstName(actor.name)} alterou status da campanha ${c.name}`,
      previousValue: c.status,
      newValue: status,
    });
    if (status === CampaignStatus.Ativa) {
      notificationsService.push({
        title: `Campanha ${c.name} publicada`,
        description: `${updated.reach.shelves} réguas atualizadas`,
        link: `/campanhas/${c.id}`,
        tone: 'success',
      });
    }
    return delay(updated, 250);
  },
};
