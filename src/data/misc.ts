import type { AppSettings, Notification, ServicePlan } from '@/types';
import { minutesAgo } from '@/utils/time';
import { CLIENT_NAME } from './stores';

export const settingsSeed = (): AppSettings => ({
  requireManagerApproval: true,
  approvalThresholdPct: 10,
  approvalForCampaigns: true,
  publicationWindowStart: '06:00',
  publicationWindowEnd: '23:00',
  defaultBrightness: 80,
  heartbeatAlertMinutes: 5,
  notifyEmail: true,
  notifyCritical: true,
  companyName: CLIENT_NAME,
});

export const notificationsSeed = (): Notification[] => [
  { id: 'nt-01', title: 'Régua G07-P03 offline', description: 'Loja Brasília Norte · há 12 minutos', at: minutesAgo(12), read: false, link: '/alertas', tone: 'danger' },
  { id: 'nt-02', title: '4 alterações aguardando aprovação', description: 'Central de preços', at: minutesAgo(30), read: false, link: '/precos', tone: 'warning' },
  { id: 'nt-03', title: 'Baixo estoque — Renata Espaguete', description: 'Loja Goiânia Centro · Gôndola G-07', at: minutesAgo(9), read: false, link: '/cameras', tone: 'warning' },
  { id: 'nt-04', title: 'Campanha Semana Selmi publicada', description: '212 réguas atualizadas', at: minutesAgo(35), read: true, link: '/campanhas/cp-001', tone: 'success' },
  { id: 'nt-05', title: 'Chamado IM-1047 com visita agendada', description: 'Loja Dourados · técnico Vinícius Araújo', at: minutesAgo(60), read: true, link: '/operacoes', tone: 'info' },
];

export const plansSeed = (): ServicePlan[] => [
  {
    id: 'managed',
    name: 'iMart Managed',
    tagline: 'Plataforma e gestão de dispositivos como serviço, sobre o hardware já instalado.',
    current: true,
    price: 'Sob consulta',
    sla: 'Atendimento remoto em até 4h · Visita em até 24h',
    services: [
      'Plataforma iMart Control',
      'Monitoramento remoto 24/7',
      'Suporte técnico',
      'Atualização de software e firmware',
      'Gestão de dispositivos',
      'Manutenção preventiva',
      'Relatórios mensais',
      'Acompanhamento de SLA',
    ],
  },
  {
    id: 'full',
    name: 'iMart Full Service',
    tagline: 'Solução completa: hardware, instalação, operação e substituição de equipamentos.',
    current: false,
    price: 'Sob consulta',
    sla: 'Atendimento remoto em até 2h · Visita em até 8h',
    services: [
      'Software iMart Control',
      'Réguas digitais de LED',
      'Controladores de gôndola',
      'Câmeras com visão computacional',
      'Instalação e mapeamento de loja',
      'Monitoramento 24/7',
      'Suporte remoto',
      'Manutenção preventiva e corretiva',
      'Substituição de equipamentos conforme contrato',
    ],
  },
];
