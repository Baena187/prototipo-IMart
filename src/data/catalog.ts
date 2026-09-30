import type { ActionType, AppUser, Brand, Client, Product, Promoter, Role, Seller } from '../types';

export const REF_DATE = '2026-10-08';

export const SELLERS: Seller[] = [
  { id: 's1', nome: 'João Silva', email: 'joao.silva@agendapromo.com.br', regional: 'Cuiabá / Várzea Grande', ativo: true },
  { id: 's2', nome: 'Ricardo Pereira', email: 'ricardo.pereira@agendapromo.com.br', regional: 'Cuiabá / Várzea Grande', ativo: true },
  { id: 's3', nome: 'Marcos Andrade', email: 'marcos.andrade@agendapromo.com.br', regional: 'Cuiabá / Várzea Grande', ativo: true },
  { id: 's4', nome: 'Luciana Prado', email: 'luciana.prado@agendapromo.com.br', regional: 'Sul — Rondonópolis', ativo: true },
  { id: 's5', nome: 'Thiago Moreira', email: 'thiago.moreira@agendapromo.com.br', regional: 'Sul — Rondonópolis', ativo: true },
  { id: 's6', nome: 'Camila Duarte', email: 'camila.duarte@agendapromo.com.br', regional: 'Norte — Sinop', ativo: true },
  { id: 's7', nome: 'André Barbosa', email: 'andre.barbosa@agendapromo.com.br', regional: 'Norte — Lucas do Rio Verde', ativo: true },
  { id: 's8', nome: 'Patrícia Lemos', email: 'patricia.lemos@agendapromo.com.br', regional: 'Leste — Primavera do Leste', ativo: true },
];

export const PROMOTERS: Promoter[] = [
  { id: 'p1', nome: 'Maria Souza', email: 'maria.souza@agendapromo.com.br', telefone: '(65) 99812-3401', cidade: 'Cuiabá', ativo: true },
  { id: 'p2', nome: 'Carlos Lima', email: 'carlos.lima@agendapromo.com.br', telefone: '(65) 99734-2208', cidade: 'Cuiabá', ativo: true },
  { id: 'p3', nome: 'Juliana Santos', email: 'juliana.santos@agendapromo.com.br', telefone: '(65) 99655-7712', cidade: 'Cuiabá', ativo: true },
  { id: 'p4', nome: 'Fernanda Oliveira', email: 'fernanda.oliveira@agendapromo.com.br', telefone: '(65) 99901-4456', cidade: 'Várzea Grande', ativo: true },
  { id: 'p5', nome: 'Rafael Mendes', email: 'rafael.mendes@agendapromo.com.br', telefone: '(65) 99788-9033', cidade: 'Várzea Grande', ativo: true },
  { id: 'p6', nome: 'Patrícia Alves', email: 'patricia.alves@agendapromo.com.br', telefone: '(66) 99602-1187', cidade: 'Rondonópolis', ativo: true },
  { id: 'p7', nome: 'Bruno Costa', email: 'bruno.costa@agendapromo.com.br', telefone: '(66) 99845-6620', cidade: 'Rondonópolis', ativo: true },
  { id: 'p8', nome: 'Aline Barros', email: 'aline.barros@agendapromo.com.br', telefone: '(66) 99713-5054', cidade: 'Sinop', ativo: true },
  { id: 'p9', nome: 'Diego Ferreira', email: 'diego.ferreira@agendapromo.com.br', telefone: '(66) 99677-3912', cidade: 'Sinop', ativo: true },
  { id: 'p10', nome: 'Camila Rocha', email: 'camila.rocha@agendapromo.com.br', telefone: '(65) 99688-2745', cidade: 'Cuiabá', ativo: true },
];

export const BRANDS: Brand[] = [
  { id: 'zaeli', nome: 'Zaeli', ativo: true },
  { id: 'renata', nome: 'Renata', ativo: true },
  { id: 'galo', nome: 'Galo', ativo: true },
  { id: 'barao', nome: 'Barão', ativo: true },
  { id: 'qualimax', nome: 'Qualimax', ativo: true },
  { id: 'vidan', nome: 'Vidan', ativo: true },
];
export const OUTRA = 'outra';

const prod = (brandId: string, nomes: string[]): Product[] =>
  nomes.map((nome, i) => ({ id: `${brandId}-${i + 1}`, brandId, nome, ativo: true }));

export const PRODUCTS: Product[] = [
  ...prod('zaeli', ['Molho de Tomate', 'Arroz', 'Milho Verde', 'Ervilha', 'Extrato de Tomate']),
  ...prod('renata', ['Macarrão Renata Espaguete', 'Macarrão Renata Parafuso', 'Macarrão Renata Penne', 'Molho Renata Tradicional', 'Macarrão Renata Instantâneo']),
  ...prod('galo', ['Azeite Extra Virgem Galo', 'Azeite Tradicional Galo', 'Azeitonas Verdes Galo', 'Azeitonas Pretas Galo', 'Azeite Composto com Alho']),
  ...prod('barao', ['Açúcar Refinado Barão', 'Açúcar Cristal Barão', 'Farinha de Trigo Barão', 'Fubá Barão', 'Farinha de Mandioca Barão']),
  ...prod('qualimax', ['Atum Ralado Qualimax', 'Sardinha em Óleo Qualimax', 'Feijão Carioca Qualimax', 'Milho para Pipoca Qualimax', 'Ketchup Qualimax']),
  ...prod('vidan', ['Biscoito Cream Cracker Vidan', 'Biscoito Maisena Vidan', 'Wafer Chocolate Vidan', 'Biscoito Recheado Vidan', 'Rosquinha de Coco Vidan']),
];

export const ACTION_TYPES: ActionType[] = [
  { id: 'simples', nome: 'Degustação simples', ativo: true },
  { id: 'preparo', nome: 'Degustação com preparo', ativo: true },
  { id: 'demonstracao', nome: 'Demonstração de produto', ativo: true },
  { id: 'lancamento', nome: 'Lançamento de produto', ativo: true },
  { id: 'sampling', nome: 'Sampling / distribuição de amostras', ativo: true },
  { id: 'promocional', nome: 'Ação promocional', ativo: true },
  { id: 'outro', nome: 'Outro', ativo: true },
];

export const TYPE_DESC: Record<string, string> = {
  simples: 'Oferta do produto pronto para consumo',
  preparo: 'Preparo no local com fogareiro, panela ou forno',
  demonstracao: 'Apresentação e uso do produto ao consumidor',
  lancamento: 'Ação de apresentação de um produto novo',
  sampling: 'Distribuição de amostras na loja',
  promocional: 'Ação ligada a campanha ou oferta',
  outro: 'Ação diferente das opções acima',
};

export const MATERIAIS = ['Mesa', 'Fogareiro', 'Panela', 'Forno elétrico', 'Caixa térmica', 'Material promocional', 'Copos descartáveis', 'Guardanapos', 'Outro'];

export const MOTIVOS_CANCELAMENTO = ['Cliente cancelou', 'Produto indisponível', 'Alteração comercial', 'Alteração de data', 'Outro'];

type Row = [string, string, string, string, string, string, string, string];
// codcli, fantasia, razão, rede, cidade, bairro, endereço, vendedor
const CLIENT_ROWS: Row[] = [
  ['000245', 'Comper Miguel Sutil', 'Comper Miguel Sutil Comércio de Alimentos Ltda', 'Comper', 'Cuiabá', 'Jardim Mariana', 'Av. Miguel Sutil, 7890', 's1'],
  ['000246', 'Comper CPA', 'Comper CPA Comércio de Alimentos Ltda', 'Comper', 'Cuiabá', 'CPA III', 'Av. Historiador Rubens de Mendonça, 3500', 's2'],
  ['000251', 'Comper Coxipó', 'Comper Coxipó Comércio de Alimentos Ltda', 'Comper', 'Cuiabá', 'Coxipó', 'Av. Fernando Corrêa da Costa, 1200', 's3'],
  ['000312', 'Fort Atacadista Coxipó', 'Fort Atacadista Coxipó Comércio Atacadista S.A.', 'Fort Atacadista', 'Cuiabá', 'Coxipó', 'Av. Beira Rio, 450', 's1'],
  ['000318', 'Fort Atacadista Várzea Grande', 'Fort Atacadista Várzea Grande Comércio Atacadista S.A.', 'Fort Atacadista', 'Várzea Grande', 'Centro Sul', 'Av. Filinto Müller, 2100', 's2'],
  ['000402', 'Big Lar Cuiabá', 'Big Lar Supermercados Cuiabá Ltda', 'Big Lar', 'Cuiabá', 'Bosque da Saúde', 'Av. Brasil, 1450', 's1'],
  ['000415', 'Big Lar Várzea Grande', 'Big Lar Supermercados Várzea Grande Ltda', 'Big Lar', 'Várzea Grande', 'Cristo Rei', 'Av. Dom Orlando Chaves, 980', 's3'],
  ['000520', 'Machado Supermercados', 'Machado & Machado Supermercados Ltda', 'Machado', 'Cuiabá', 'Dom Aquino', 'Rua Barão de Melgaço, 3120', 's1'],
  ['000533', 'Machado Supermercados Jardim das Américas', 'Machado & Machado Supermercados Ltda', 'Machado', 'Cuiabá', 'Jardim das Américas', 'Av. Archimedes Pereira Lima, 640', 's2'],
  ['000601', 'Atacadão Cuiabá', 'Atacadão Cuiabá Comércio de Alimentos S.A.', 'Atacadão', 'Cuiabá', 'Industrial', 'Av. Arquimedes Pereira Lima, 2380', 's3'],
  ['000608', 'Atacadão Várzea Grande', 'Atacadão Várzea Grande Comércio de Alimentos S.A.', 'Atacadão', 'Várzea Grande', 'Industrial', 'Av. Castelo Branco, 5600', 's2'],
  ['000615', 'Atacadão Rondonópolis', 'Atacadão Rondonópolis Comércio de Alimentos S.A.', 'Atacadão', 'Rondonópolis', 'Vila Birigui', 'Av. Lions Internacional, 1800', 's4'],
  ['000702', 'Assaí Cuiabá', 'Assaí Cuiabá Atacadista Ltda', 'Assaí', 'Cuiabá', 'Jardim Imperial', 'Av. Isaac Póvoas, 2900', 's1'],
  ['000709', 'Assaí Rondonópolis', 'Assaí Rondonópolis Atacadista Ltda', 'Assaí', 'Rondonópolis', 'Jardim Atlântico', 'Av. Bandeirantes, 3300', 's5'],
  ['000716', 'Assaí Sinop', 'Assaí Sinop Atacadista Ltda', 'Assaí', 'Sinop', 'Setor Comercial', 'Av. dos Ingás, 3100', 's6'],
  ['000804', 'Supermercado Modelo', 'Modelo Comércio de Gêneros Alimentícios Ltda', 'Modelo', 'Cuiabá', 'Goiabeiras', 'Av. Mato Grosso, 870', 's3'],
  ['000811', 'Supermercado Modelo Coophema', 'Modelo Comércio de Gêneros Alimentícios Ltda', 'Modelo', 'Cuiabá', 'Coophema', 'Rua Três, 215', 's3'],
  ['000903', 'Comper Rondonópolis', 'Comper Rondonópolis Comércio de Alimentos Ltda', 'Comper', 'Rondonópolis', 'Jardim Tropical', 'Av. Fernando Corrêa da Costa, 4400', 's4'],
  ['000910', 'Comper Sinop', 'Comper Sinop Comércio de Alimentos Ltda', 'Comper', 'Sinop', 'Jardim Botânico', 'Av. Júlio Campos, 2750', 's6'],
  ['001002', 'Fort Atacadista Rondonópolis', 'Fort Atacadista Rondonópolis Comércio Atacadista S.A.', 'Fort Atacadista', 'Rondonópolis', 'Vila Operária', 'Av. Ary Coelho, 1250', 's5'],
  ['001015', 'Supermercado Bandeirantes', 'Bandeirantes Supermercados Ltda', 'Independente', 'Lucas do Rio Verde', 'Centro', 'Av. Mato Grosso, 1500', 's7'],
  ['001022', 'Mercado Central Lucas', 'Mercado Central Lucas Eireli', 'Independente', 'Lucas do Rio Verde', 'Jardim Primavera', 'Av. Brasil Norte, 640', 's7'],
  ['001108', 'Supermercado Planalto', 'Planalto Comércio de Alimentos Ltda', 'Independente', 'Primavera do Leste', 'Centro', 'Av. Paraguai, 820', 's8'],
  ['001115', 'Big Lar Sinop', 'Big Lar Supermercados Sinop Ltda', 'Big Lar', 'Sinop', 'Jardim Jacarandás', 'Av. das Itaúbas, 2050', 's6'],
  ['001120', 'Supermercado Pantanal', 'Pantanal Supermercados Ltda', 'Independente', 'Várzea Grande', 'Jardim Glória', 'Rua Vitória Régia, 330', 's2'],
];

function cnpj(i: number) {
  const a = String(11 + i * 7).padStart(2, '0');
  const b = String(((i * 137) % 900) + 100).padStart(3, '0');
  const c = String(((i * 251) % 900) + 100).padStart(3, '0');
  const d = String((i * 13) % 100).padStart(2, '0');
  return `${a}.${b}.${c}/0001-${d}`;
}

export const CLIENTS: Client[] = CLIENT_ROWS.map((r, i) => ({
  codcli: r[0],
  fantasia: r[1],
  razao: r[2],
  cnpj: cnpj(i + 3),
  rede: r[3],
  cidade: r[4],
  bairro: r[5],
  endereco: r[6],
  vendedorId: r[7],
  ativo: r[0] !== '001120' && r[0] !== '000811',
}));

export const UF = 'MT';

export const USERS: AppUser[] = [
  { id: 'u-gestora', nome: 'Ana Paula Martins', email: 'ana.martins@agendapromo.com.br', perfil: 'gestora', ativo: true },
  { id: 'u-admin', nome: 'Roberto Campos', email: 'admin@agendapromo.com.br', perfil: 'admin', ativo: true },
  ...SELLERS.map<AppUser>((s) => ({ id: `u-${s.id}`, nome: s.nome, email: s.email, perfil: 'vendedor', ativo: true })),
  ...PROMOTERS.map<AppUser>((p) => ({ id: `u-${p.id}`, nome: p.nome, email: p.email, perfil: 'promotor', ativo: true })),
];

export const DEMO_IDENTITY: Record<Role, { id: string; nome: string; cargo: string; email: string }> = {
  vendedor: { id: 's1', nome: 'João Silva', cargo: 'Vendedor', email: 'joao.silva@agendapromo.com.br' },
  gestora: { id: 'u-gestora', nome: 'Ana Paula Martins', cargo: 'Gestora de promotores', email: 'ana.martins@agendapromo.com.br' },
  promotor: { id: 'p2', nome: 'Carlos Lima', cargo: 'Promotor de merchandising', email: 'carlos.lima@agendapromo.com.br' },
  admin: { id: 'u-admin', nome: 'Roberto Campos', cargo: 'Administrador', email: 'admin@agendapromo.com.br' },
};

export const ROLE_LABEL: Record<Role, string> = {
  vendedor: 'Vendedor',
  gestora: 'Gestora',
  promotor: 'Promotor',
  admin: 'Administrador',
};
