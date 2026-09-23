import { normalize } from '@/utils/format';
import { db } from './collections';

export interface SearchResult {
  id: string;
  group: 'Páginas' | 'Lojas' | 'Gôndolas' | 'Réguas' | 'Produtos' | 'Campanhas' | 'Chamados';
  title: string;
  subtitle?: string;
  to: string;
}

const PAGES: SearchResult[] = [
  { id: 'pg-dash', group: 'Páginas', title: 'Visão geral', to: '/' },
  { id: 'pg-lojas', group: 'Páginas', title: 'Lojas', to: '/lojas' },
  { id: 'pg-gond', group: 'Páginas', title: 'Gôndolas', to: '/gondolas' },
  { id: 'pg-reg', group: 'Páginas', title: 'Réguas digitais', to: '/reguas' },
  { id: 'pg-prod', group: 'Páginas', title: 'Produtos', to: '/produtos' },
  { id: 'pg-prec', group: 'Páginas', title: 'Central de preços', to: '/precos' },
  { id: 'pg-camp', group: 'Páginas', title: 'Campanhas', to: '/campanhas' },
  { id: 'pg-mon', group: 'Páginas', title: 'Monitoramento', to: '/monitoramento' },
  { id: 'pg-cam', group: 'Páginas', title: 'Câmeras', to: '/cameras' },
  { id: 'pg-al', group: 'Páginas', title: 'Alertas', to: '/alertas' },
  { id: 'pg-op', group: 'Páginas', title: 'Central de operações', to: '/operacoes' },
  { id: 'pg-ct', group: 'Páginas', title: 'Contrato & Serviços', to: '/contrato' },
  { id: 'pg-aud', group: 'Páginas', title: 'Auditoria', to: '/auditoria' },
  { id: 'pg-usr', group: 'Páginas', title: 'Usuários e permissões', to: '/usuarios' },
  { id: 'pg-cfg', group: 'Páginas', title: 'Configurações', to: '/configuracoes' },
];

export function globalSearch(query: string, limitPerGroup = 5): SearchResult[] {
  const q = normalize(query.trim());
  if (!q) return PAGES.slice(0, 6);
  const match = (...fields: (string | undefined)[]) => fields.some((f) => f && normalize(f).includes(q));
  const storeName = (id: string) => db.stores.get(id)?.name ?? '';

  const results: SearchResult[] = [
    ...PAGES.filter((p) => match(p.title)),
    ...db.stores
      .all()
      .filter((s) => match(s.name, s.code, s.city))
      .slice(0, limitPerGroup)
      .map<SearchResult>((s) => ({ id: s.id, group: 'Lojas', title: s.name, subtitle: `${s.code} · ${s.city}/${s.uf}`, to: `/lojas/${s.id}` })),
    ...db.products
      .all()
      .filter((p) => match(p.shortName, p.description, p.sku, p.ean, p.brand))
      .slice(0, limitPerGroup)
      .map<SearchResult>((p) => ({ id: p.id, group: 'Produtos', title: p.shortName, subtitle: `${p.sku} · ${p.brand}`, to: `/produtos?produto=${p.id}` })),
    ...db.gondolas
      .all()
      .filter((g) => match(`${g.code} ${storeName(g.storeId)}`, g.aisle))
      .slice(0, limitPerGroup)
      .map<SearchResult>((g) => ({ id: g.id, group: 'Gôndolas', title: `Gôndola ${g.code} · ${g.aisle}`, subtitle: storeName(g.storeId), to: `/gondolas/${g.id}` })),
    ...db.shelves
      .all()
      .filter((s) => match(s.code, `${s.code} ${storeName(s.storeId)}`))
      .slice(0, limitPerGroup)
      .map<SearchResult>((s) => ({ id: s.id, group: 'Réguas', title: `Régua ${s.code}`, subtitle: storeName(s.storeId), to: `/reguas/${s.id}/editor` })),
    ...db.campaigns
      .all()
      .filter((c) => match(c.name, c.brand))
      .slice(0, limitPerGroup)
      .map<SearchResult>((c) => ({ id: c.id, group: 'Campanhas', title: c.name, subtitle: c.brand, to: `/campanhas/${c.id}` })),
    ...db.tickets
      .all()
      .filter((t) => match(t.number, t.problem, t.equipment))
      .slice(0, limitPerGroup)
      .map<SearchResult>((t) => ({ id: t.id, group: 'Chamados', title: `${t.number} · ${t.problem}`, subtitle: storeName(t.storeId), to: `/operacoes?chamado=${t.id}` })),
  ];
  return results;
}
