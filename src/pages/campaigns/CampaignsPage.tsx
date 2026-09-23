import { Megaphone, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, FilterSelect } from '@/components/shared/FilterBar';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/misc';
import { useAuth } from '@/contexts/AuthContext';
import { BRANDS } from '@/data/products';
import { CAMPAIGN_TYPE_LABEL } from '@/data/campaigns';
import { useQuery } from '@/hooks/useQuery';
import { campaignsService } from '@/services';
import { CampaignStatus, CampaignType, type Campaign } from '@/types';
import { formatDate, formatInt, normalize } from '@/utils/format';
import { CAMPAIGN_STATUS } from '@/utils/labels';

type Tab = 'todas' | CampaignStatus;

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const { data, loading } = useQuery(() => campaignsService.list(), []);
  const [tab, setTab] = useState<Tab>('todas');
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<CampaignType | ''>('');

  const base = useMemo(
    () =>
      (data ?? []).filter(
        (c) => (!brand || c.brand === brand) && (!type || c.type === type) && (!search || normalize(`${c.name} ${c.brand} ${c.message}`).includes(normalize(search))),
      ),
    [data, brand, type, search],
  );
  const rows = base.filter((c) => tab === 'todas' || c.status === tab);
  const count = (s: Tab) => base.filter((c) => s === 'todas' || c.status === s).length;
  const all = data ?? [];
  const active = all.filter((c) => c.status === CampaignStatus.Ativa);

  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      header: 'Campanha',
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{c.name}</p>
          <p className="truncate text-xs text-slate-500">{c.message}</p>
        </div>
      ),
      sortValue: (c) => c.name,
    },
    { key: 'type', header: 'Tipo', cell: (c) => <Badge tone="outline">{CAMPAIGN_TYPE_LABEL[c.type]}</Badge>, sortValue: (c) => c.type, hideBelow: 'lg' },
    { key: 'brand', header: 'Marca', cell: (c) => c.brand, sortValue: (c) => c.brand, hideBelow: 'sm' },
    {
      key: 'period',
      header: 'Período',
      cell: (c) => (
        <div className="whitespace-nowrap text-slate-600">
          {formatDate(c.startDate)} – {formatDate(c.endDate)}
          <p className="text-xs text-slate-400">
            {c.startTime} às {c.endTime}
          </p>
        </div>
      ),
      sortValue: (c) => c.startDate,
      hideBelow: 'md',
    },
    { key: 'stores', header: 'Lojas', align: 'right', cell: (c) => c.storeIds.length, sortValue: (c) => c.storeIds.length, hideBelow: 'md' },
    { key: 'reach', header: 'Réguas', align: 'right', cell: (c) => (c.reach.shelves ? formatInt(c.reach.shelves) : '—'), sortValue: (c) => c.reach.shelves, hideBelow: 'lg' },
    { key: 'prio', header: 'Prioridade', cell: (c) => <span className="capitalize">{c.priority === 'media' ? 'média' : c.priority}</span>, hideBelow: 'xl' },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge map={CAMPAIGN_STATUS} value={c.status} />, sortValue: (c) => c.status },
  ];

  return (
    <div>
      <PageHeader
        title="Campanhas"
        description="Promoções, ofertas e destaques exibidos nas réguas digitais."
        actions={
          <Button onClick={() => navigate('/campanhas/nova')} disabled={!can('campaigns.edit')}>
            <Plus /> Nova campanha
          </Button>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Campanhas ativas" value={active.length} loading={loading} icon={<Megaphone />} />
        <StatCard label="Réguas com campanha" value={formatInt(active.reduce((a, c) => a + c.reach.shelves, 0))} loading={loading} />
        <StatCard label="Impressões estimadas (7 dias)" value={formatInt(active.reduce((a, c) => a + c.reach.impressions, 0))} loading={loading} hint="fluxo × tempo de exposição" />
        <StatCard label="Aguardando aprovação" value={all.filter((c) => c.status === CampaignStatus.AguardandoAprovacao).length} loading={loading} tone="warning" />
      </div>
      <Card>
        <Tabs
          className="px-2"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'todas', label: 'Todas', count: count('todas') },
            { value: CampaignStatus.Ativa, label: 'Ativas', count: count(CampaignStatus.Ativa) },
            { value: CampaignStatus.Agendada, label: 'Agendadas', count: count(CampaignStatus.Agendada) },
            { value: CampaignStatus.AguardandoAprovacao, label: 'Aguardando aprovação', count: count(CampaignStatus.AguardandoAprovacao) },
            { value: CampaignStatus.Rascunho, label: 'Rascunhos', count: count(CampaignStatus.Rascunho) },
            { value: CampaignStatus.Pausada, label: 'Pausadas', count: count(CampaignStatus.Pausada) },
            { value: CampaignStatus.Encerrada, label: 'Encerradas', count: count(CampaignStatus.Encerrada) },
          ]}
        />
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Buscar campanha"
          hasFilters={!!(search || brand || type)}
          onClear={() => {
            setSearch('');
            setBrand('');
            setType('');
          }}
        >
          <FilterSelect value={brand} onChange={setBrand} allLabel="Todas as marcas" options={BRANDS.map((b) => ({ value: b, label: b }))} />
          <FilterSelect value={type} onChange={setType} allLabel="Todos os tipos" options={Object.values(CampaignType).map((t) => ({ value: t, label: CAMPAIGN_TYPE_LABEL[t] }))} />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          rowKey={(c) => c.id}
          onRowClick={(c) => navigate(`/campanhas/${c.id}`)}
          empty={{ icon: <Megaphone />, title: 'Nenhuma campanha encontrada', action: <Button variant="outline" onClick={() => navigate('/campanhas/nova')}>Criar campanha</Button> }}
        />
      </Card>
    </div>
  );
}
