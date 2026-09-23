import { ServiceStage, StoreStatus, type Store } from '@/types';
import { daysAgo, minutesAgo } from '@/utils/time';

export const CLIENT_NAME = 'iMart Supermercado';

type StoreSeed = [
  code: string,
  name: string,
  city: string,
  uf: string,
  region: string,
  address: string,
  manager: string,
  status: StoreStatus,
  stage: ServiceStage,
  goLiveDaysAgo: number,
  areaM2: number,
  checkouts: number,
];

const seeds: StoreSeed[] = [
  ['LJ-001', 'Goiânia Centro', 'Goiânia', 'GO', 'Centro-Oeste I', 'Av. Goiás, 1280 — Setor Central', 'Marcos Tavares', StoreStatus.Normal, ServiceStage.Monitoramento, 412, 3200, 18],
  ['LJ-002', 'Goiânia Setor Bueno', 'Goiânia', 'GO', 'Centro-Oeste I', 'Av. T-4, 915 — Setor Bueno', 'Patrícia Lemos', StoreStatus.Normal, ServiceStage.Monitoramento, 380, 2800, 16],
  ['LJ-003', 'Goiânia Jardim Goiás', 'Goiânia', 'GO', 'Centro-Oeste I', 'Av. Jamel Cecílio, 3300 — Jd. Goiás', 'Rodrigo Nunes', StoreStatus.Atencao, ServiceStage.Monitoramento, 301, 3500, 20],
  ['LJ-004', 'Aparecida de Goiânia', 'Aparecida de Goiânia', 'GO', 'Centro-Oeste I', 'Av. Independência, 4410 — Centro', 'Juliana Prado', StoreStatus.Normal, ServiceStage.Monitoramento, 265, 2600, 14],
  ['LJ-005', 'Anápolis', 'Anápolis', 'GO', 'Centro-Oeste I', 'Av. Brasil Sul, 2250 — Centro', 'Eduardo Siqueira', StoreStatus.Normal, ServiceStage.Monitoramento, 240, 2400, 12],
  ['LJ-006', 'Brasília Norte', 'Brasília', 'DF', 'Distrito Federal', 'SHCN CL 214, Bloco C — Asa Norte', 'Fernanda Rocha', StoreStatus.Atencao, ServiceStage.Suporte, 355, 3000, 17],
  ['LJ-007', 'Taguatinga', 'Brasília', 'DF', 'Distrito Federal', 'CNB 12, Lote 4 — Taguatinga Norte', 'Leandro Paiva', StoreStatus.Normal, ServiceStage.Monitoramento, 198, 2700, 15],
  ['LJ-008', 'Águas Claras', 'Brasília', 'DF', 'Distrito Federal', 'Av. Castanheiras, 1020 — Águas Claras', 'Camila Duarte', StoreStatus.Normal, ServiceStage.Monitoramento, 176, 2200, 12],
  ['LJ-009', 'Cuiabá CPA', 'Cuiabá', 'MT', 'Centro-Oeste II', 'Av. Historiador Rubens de Mendonça, 3800 — CPA', 'Thiago Moraes', StoreStatus.Atencao, ServiceStage.Manutencao, 290, 3100, 18],
  ['LJ-010', 'Várzea Grande', 'Várzea Grande', 'MT', 'Centro-Oeste II', 'Av. Couto Magalhães, 1500 — Centro', 'Aline Ferraz', StoreStatus.Normal, ServiceStage.Monitoramento, 150, 2300, 12],
  ['LJ-011', 'Rondonópolis', 'Rondonópolis', 'MT', 'Centro-Oeste II', 'Av. Lions Internacional, 800 — Vila Aurora', 'Gustavo Rezende', StoreStatus.Normal, ServiceStage.Monitoramento, 132, 2100, 11],
  ['LJ-012', 'Campo Grande Centro', 'Campo Grande', 'MS', 'Centro-Oeste II', 'Av. Afonso Pena, 2700 — Centro', 'Renata Queiroz', StoreStatus.Normal, ServiceStage.Monitoramento, 222, 2900, 16],
  ['LJ-013', 'Dourados', 'Dourados', 'MS', 'Centro-Oeste II', 'Av. Marcelino Pires, 3100 — Centro', 'Bruno Carvalho', StoreStatus.Critico, ServiceStage.Suporte, 118, 2000, 10],
  ['LJ-014', 'Palmas', 'Palmas', 'TO', 'Norte', 'Av. Teotônio Segurado, Qd. 202 Sul', 'Larissa Mendes', StoreStatus.Normal, ServiceStage.Monitoramento, 96, 2200, 11],
  ['LJ-015', 'Rio Verde', 'Rio Verde', 'GO', 'Centro-Oeste I', 'Av. Presidente Vargas, 1900 — Centro', 'Otávio Brandão', StoreStatus.Normal, ServiceStage.Monitoramento, 84, 1900, 10],
  ['LJ-016', 'Uberlândia', 'Uberlândia', 'MG', 'Sudeste', 'Av. Rondon Pacheco, 4600 — Tibery', 'Sabrina Teles', StoreStatus.Normal, ServiceStage.Homologacao, 12, 3300, 19],
  ['LJ-017', 'Goiânia Campinas', 'Goiânia', 'GO', 'Centro-Oeste I', 'Av. 24 de Outubro, 1400 — Campinas', 'Igor Vasconcelos', StoreStatus.Normal, ServiceStage.Monitoramento, 58, 2500, 13],
  ['LJ-018', 'Sinop', 'Sinop', 'MT', 'Centro-Oeste II', 'Av. dos Tarumãs, 2200 — Centro', 'Priscila Antunes', StoreStatus.Implantacao, ServiceStage.Instalacao, -21, 2400, 12],
];

const lastSeenMinutes = [1, 1, 2, 1, 1, 3, 1, 2, 4, 1, 2, 1, 38, 1, 2, 1, 1, 240];

export const storesSeed = (): Store[] =>
  seeds.map((s, i) => ({
    id: s[0].toLowerCase().replace('-', ''),
    code: s[0],
    name: s[1],
    displayName: `${CLIENT_NAME} — Loja ${s[1]}`,
    city: s[2],
    uf: s[3],
    region: s[4],
    address: s[5],
    manager: s[6],
    phone: `(62) 3${String(200 + i * 7).padStart(3, '0')}-${String(1000 + i * 137).slice(0, 4)}`,
    status: s[7],
    stage: s[8],
    goLiveAt: daysAgo(s[9]),
    lastSeenAt: minutesAgo(lastSeenMinutes[i]),
    areaM2: s[10],
    checkouts: s[11],
  }));
