import { UserRole, UserStatus, type Permission, type RoleDefinition, type User } from '@/types';
import { daysAgo, hoursAgo, minutesAgo } from '@/utils/time';

const ALL: Permission[] = [
  'dashboard.view', 'stores.view', 'stores.manage', 'gondolas.view', 'gondolas.manage',
  'shelves.edit', 'shelves.publish', 'products.view', 'products.manage', 'prices.view',
  'prices.edit', 'prices.approve', 'prices.publish', 'campaigns.view', 'campaigns.edit',
  'campaigns.approve', 'monitoring.view', 'devices.manage', 'cameras.view', 'alerts.view',
  'alerts.manage', 'operations.view', 'operations.manage', 'audit.view', 'users.view',
  'users.manage', 'settings.manage', 'contract.view',
];

const READ: Permission[] = [
  'dashboard.view', 'stores.view', 'gondolas.view', 'products.view', 'prices.view',
  'campaigns.view', 'monitoring.view', 'cameras.view', 'alerts.view', 'operations.view',
];

export const ROLES: RoleDefinition[] = [
  {
    role: UserRole.AdminImart,
    label: 'Administrador iMart',
    description: 'Acesso total à plataforma, a todos os clientes e às configurações de serviço.',
    permissions: ALL,
  },
  {
    role: UserRole.AdminCliente,
    label: 'Administrador do cliente',
    description: 'Gerencia lojas, usuários e regras de aprovação da própria rede.',
    permissions: ALL.filter((p) => p !== 'devices.manage'),
  },
  {
    role: UserRole.GerenteLoja,
    label: 'Gerente de loja',
    description: 'Aprova campanhas e alterações de preço das lojas sob sua responsabilidade.',
    permissions: [...READ, 'shelves.edit', 'shelves.publish', 'prices.edit', 'prices.approve', 'prices.publish', 'campaigns.edit', 'campaigns.approve', 'alerts.manage', 'audit.view'],
  },
  {
    role: UserRole.Operador,
    label: 'Operador',
    description: 'Cria alterações de preço e ajusta o conteúdo das réguas digitais.',
    permissions: [...READ, 'shelves.edit', 'shelves.publish', 'prices.edit', 'alerts.manage'],
  },
  {
    role: UserRole.Marketing,
    label: 'Marketing',
    description: 'Planeja, cria e acompanha campanhas promocionais.',
    permissions: [...READ, 'campaigns.edit', 'products.manage'],
  },
  {
    role: UserRole.Suporte,
    label: 'Suporte',
    description: 'Acessa monitoramento, alertas e chamados técnicos.',
    permissions: ['dashboard.view', 'stores.view', 'gondolas.view', 'monitoring.view', 'devices.manage', 'cameras.view', 'alerts.view', 'alerts.manage', 'operations.view', 'operations.manage', 'audit.view', 'contract.view'],
  },
  {
    role: UserRole.Tecnico,
    label: 'Técnico de campo',
    description: 'Acessa equipamentos e ordens de serviço atribuídas.',
    permissions: ['dashboard.view', 'stores.view', 'gondolas.view', 'monitoring.view', 'devices.manage', 'cameras.view', 'alerts.view', 'operations.view', 'operations.manage'],
  },
  {
    role: UserRole.Visualizacao,
    label: 'Visualização',
    description: 'Somente leitura de indicadores, lojas e conteúdo publicado.',
    permissions: READ,
  },
];

export const ROLE_LABEL: Record<UserRole, string> = Object.fromEntries(
  ROLES.map((r) => [r.role, r.label]),
) as Record<UserRole, string>;

export const usersSeed = (): User[] => [
  { id: 'u01', name: 'Daniel Souza', email: 'daniel.souza@imart.com.br', role: UserRole.AdminImart, storeIds: 'all', status: UserStatus.Ativo, lastAccessAt: minutesAgo(3), phone: '(62) 99811-2040', organization: 'iMart' },
  { id: 'u02', name: 'Carolina Mendes', email: 'carolina.mendes@imartsupermercado.com.br', role: UserRole.AdminCliente, storeIds: 'all', status: UserStatus.Ativo, lastAccessAt: hoursAgo(2), phone: '(62) 99642-1188', organization: 'iMart Supermercado' },
  { id: 'u03', name: 'Marcos Tavares', email: 'marcos.tavares@imartsupermercado.com.br', role: UserRole.GerenteLoja, storeIds: ['lj001'], status: UserStatus.Ativo, lastAccessAt: minutesAgo(40), organization: 'iMart Supermercado' },
  { id: 'u04', name: 'Fernanda Rocha', email: 'fernanda.rocha@imartsupermercado.com.br', role: UserRole.GerenteLoja, storeIds: ['lj006', 'lj007', 'lj008'], status: UserStatus.Ativo, lastAccessAt: hoursAgo(5), organization: 'iMart Supermercado' },
  { id: 'u05', name: 'Lucas Almeida', email: 'lucas.almeida@imartsupermercado.com.br', role: UserRole.Operador, storeIds: ['lj001', 'lj002', 'lj003'], status: UserStatus.Ativo, lastAccessAt: minutesAgo(12), organization: 'iMart Supermercado' },
  { id: 'u06', name: 'Bianca Ferreira', email: 'bianca.ferreira@imartsupermercado.com.br', role: UserRole.Operador, storeIds: ['lj009', 'lj010', 'lj011'], status: UserStatus.Ativo, lastAccessAt: hoursAgo(1), organization: 'iMart Supermercado' },
  { id: 'u07', name: 'Rafael Costa', email: 'rafael.costa@imartsupermercado.com.br', role: UserRole.Marketing, storeIds: 'all', status: UserStatus.Ativo, lastAccessAt: hoursAgo(3), organization: 'iMart Supermercado' },
  { id: 'u08', name: 'Amanda Ribeiro', email: 'amanda.ribeiro@imart.com.br', role: UserRole.Suporte, storeIds: 'all', status: UserStatus.Ativo, lastAccessAt: minutesAgo(6), organization: 'iMart' },
  { id: 'u09', name: 'Henrique Lopes', email: 'henrique.lopes@imart.com.br', role: UserRole.Tecnico, storeIds: ['lj001', 'lj002', 'lj003', 'lj004', 'lj005', 'lj017'], status: UserStatus.Ativo, lastAccessAt: hoursAgo(4), phone: '(62) 99120-4471', organization: 'iMart' },
  { id: 'u10', name: 'Paulo Martins', email: 'paulo.martins@imart.com.br', role: UserRole.Tecnico, storeIds: ['lj006', 'lj007', 'lj008'], status: UserStatus.Ativo, lastAccessAt: hoursAgo(9), phone: '(61) 99345-7702', organization: 'iMart' },
  { id: 'u11', name: 'Vinícius Araújo', email: 'vinicius.araujo@imart.com.br', role: UserRole.Tecnico, storeIds: ['lj009', 'lj010', 'lj011', 'lj012', 'lj013', 'lj018'], status: UserStatus.Ativo, lastAccessAt: daysAgo(1), phone: '(65) 99277-3310', organization: 'iMart' },
  { id: 'u12', name: 'Diretoria Comercial', email: 'diretoria@imartsupermercado.com.br', role: UserRole.Visualizacao, storeIds: 'all', status: UserStatus.Ativo, lastAccessAt: daysAgo(2), organization: 'iMart Supermercado' },
  { id: 'u13', name: 'Tatiane Borges', email: 'tatiane.borges@imartsupermercado.com.br', role: UserRole.Marketing, storeIds: 'all', status: UserStatus.Convidado, organization: 'iMart Supermercado' },
  { id: 'u14', name: 'Sérgio Pacheco', email: 'sergio.pacheco@imartsupermercado.com.br', role: UserRole.Operador, storeIds: ['lj013'], status: UserStatus.Bloqueado, lastAccessAt: daysAgo(46), organization: 'iMart Supermercado' },
];
