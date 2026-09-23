import {
  Activity,
  Bell,
  Cctv,
  Columns3,
  FileText,
  LayoutDashboard,
  Megaphone,
  Package,
  Rows3,
  ScrollText,
  Settings,
  Store,
  Tag,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  badge?: 'alerts' | 'approvals';
}

export const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
  {
    items: [{ to: '/', label: 'Visão geral', icon: LayoutDashboard, permission: 'dashboard.view' }],
  },
  {
    title: 'Loja e gôndola',
    items: [
      { to: '/lojas', label: 'Lojas', icon: Store, permission: 'stores.view' },
      { to: '/gondolas', label: 'Gôndolas', icon: Columns3, permission: 'gondolas.view' },
      { to: '/reguas', label: 'Réguas digitais', icon: Rows3, permission: 'gondolas.view' },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { to: '/produtos', label: 'Produtos', icon: Package, permission: 'products.view' },
      { to: '/precos', label: 'Preços', icon: Tag, permission: 'prices.view', badge: 'approvals' },
      { to: '/campanhas', label: 'Campanhas', icon: Megaphone, permission: 'campaigns.view' },
    ],
  },
  {
    title: 'Operação',
    items: [
      { to: '/monitoramento', label: 'Monitoramento', icon: Activity, permission: 'monitoring.view' },
      { to: '/cameras', label: 'Câmeras', icon: Cctv, permission: 'cameras.view' },
      { to: '/alertas', label: 'Alertas', icon: Bell, permission: 'alerts.view', badge: 'alerts' },
      { to: '/operacoes', label: 'Operações', icon: Wrench, permission: 'operations.view' },
      { to: '/contrato', label: 'Contrato & Serviços', icon: FileText, permission: 'contract.view' },
    ],
  },
  {
    title: 'Administração',
    items: [
      { to: '/auditoria', label: 'Auditoria', icon: ScrollText, permission: 'audit.view' },
      { to: '/usuarios', label: 'Usuários', icon: Users, permission: 'users.view' },
      { to: '/configuracoes', label: 'Configurações', icon: Settings, permission: 'settings.manage' },
    ],
  },
];
