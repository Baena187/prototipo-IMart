import { TicketKind, TicketPriority, TicketStatus, type Ticket } from '@/types';
import { hoursAgo, hoursFromNow, minutesAgo } from '@/utils/time';
import { CLIENT_NAME } from './stores';

const SLA: Record<TicketPriority, number> = {
  [TicketPriority.Critica]: 2,
  [TicketPriority.Alta]: 4,
  [TicketPriority.Media]: 8,
  [TicketPriority.Baixa]: 24,
};

type TicketSeed = [
  number: number,
  kind: TicketKind,
  storeId: string,
  equipment: string,
  problem: string,
  description: string,
  priority: TicketPriority,
  openedHoursAgo: number,
  status: TicketStatus,
  technicianId: string | undefined,
  scheduledInHours?: number,
];

const seeds: TicketSeed[] = [
  [1048, TicketKind.Corretivo, 'lj006', 'Régua LED G07-P03', 'Régua sem comunicação', 'Régua G07-P03 sem heartbeat. Controlador responde, possível falha no cabo de dados da prateleira.', TicketPriority.Alta, 0.3, TicketStatus.EmDiagnostico, 'u10'],
  [1047, TicketKind.Incidente, 'lj013', 'Controlador CTL-013-G02', 'Queda de 4 réguas simultâneas', 'Réguas das gôndolas G-02 e G-08 offline. Suspeita de disjuntor do circuito de iluminação.', TicketPriority.Critica, 0.7, TicketStatus.VisitaAgendada, 'u11', 3],
  [1046, TicketKind.Corretivo, 'lj009', 'Câmera CAM-021', 'Câmera sem comunicação', 'Câmera sem imagens desde o início da manhã. Porta do switch PoE sem link.', TicketPriority.Alta, 1.1, TicketStatus.AtendimentoRemoto, 'u11'],
  [1045, TicketKind.Corretivo, 'lj002', 'Régua LED G10-P03', 'Régua apagada', 'Régua não exibe conteúdo. Diagnóstico remoto indica falha de alimentação.', TicketPriority.Alta, 1.6, TicketStatus.Aberto, undefined],
  [1044, TicketKind.Corretivo, 'lj003', 'Controlador CTL-003-G03', 'Temperatura elevada', 'Controlador acima de 55 °C. Verificar ventilação e acúmulo de poeira.', TicketPriority.Media, 3.4, TicketStatus.VisitaAgendada, 'u09', 20],
  [1043, TicketKind.Incidente, 'lj013', 'Serviço SYNC-013', 'Atraso na sincronização', 'Fila de publicação crescente. Link de internet da loja com perda de pacotes.', TicketPriority.Alta, 0.6, TicketStatus.AtendimentoRemoto, 'u08'],
  [1042, TicketKind.Preventiva, 'lj001', 'Gôndolas G-01 a G-09', 'Manutenção preventiva trimestral', 'Limpeza de réguas, inspeção de conectores e aferição de brilho.', TicketPriority.Baixa, 26, TicketStatus.VisitaAgendada, 'u09', 44],
  [1041, TicketKind.Substituicao, 'lj009', 'Régua LED G09-P01', 'Substituição de régua', 'Régua com segmento de LEDs queimado. Equipamento reserva solicitado ao estoque.', TicketPriority.Media, 30, TicketStatus.EmAtendimento, 'u11'],
  [1040, TicketKind.Preventiva, 'lj006', 'Gôndolas G-10 a G-16', 'Manutenção preventiva trimestral', 'Checklist padrão de manutenção preventiva.', TicketPriority.Baixa, 48, TicketStatus.VisitaAgendada, 'u10', 70],
  [1039, TicketKind.Corretivo, 'lj012', 'Régua LED G04-P02', 'Oscilação de brilho', 'Brilho oscilando em horários de pico. Possível interferência elétrica.', TicketPriority.Media, 6, TicketStatus.EmDiagnostico, 'u08'],
  [1038, TicketKind.Substituicao, 'lj003', 'Câmera corredor Massas', 'Substituição de lente', 'Imagem desfocada mesmo após ajuste remoto de foco.', TicketPriority.Baixa, 52, TicketStatus.Aberto, undefined],
  [1037, TicketKind.Incidente, 'lj010', 'Publicação de preços', 'Divergência PDV × régua', 'Preço exibido diferente do PDV para Galo Espaguete.', TicketPriority.Alta, 1.1, TicketStatus.Resolvido, 'u08'],
  [1036, TicketKind.Corretivo, 'lj016', 'Régua LED G06-P01', 'Régua offline em homologação', 'Falha durante teste de carga da homologação.', TicketPriority.Media, 5, TicketStatus.EmAtendimento, 'u09'],
  [1035, TicketKind.Preventiva, 'lj012', 'Loja completa', 'Revisão semestral', 'Revisão completa de gateways, controladores, réguas e câmeras.', TicketPriority.Baixa, 90, TicketStatus.Resolvido, 'u11'],
  [1034, TicketKind.Substituicao, 'lj011', 'Réguas com firmware antigo', 'Atualização de firmware', '14 réguas com led-1.13.8. Atualização remota em janela noturna.', TicketPriority.Baixa, 20, TicketStatus.AtendimentoRemoto, 'u08'],
  [1033, TicketKind.Substituicao, 'lj018', 'Kit de instalação', 'Equipamentos para go-live', 'Aguardando 12 réguas e 2 gateways para concluir instalação.', TicketPriority.Media, 72, TicketStatus.EmAtendimento, 'u11'],
];

export const ticketsSeed = (): Ticket[] =>
  seeds.map((s) => {
    const openedAt = hoursAgo(s[7]);
    const sla = SLA[s[6]];
    const history = [
      { id: `${s[0]}-h1`, at: openedAt, author: 'Sistema iMart', text: 'Chamado aberto automaticamente a partir de alerta de monitoramento.', status: TicketStatus.Aberto },
    ];
    if (s[8] !== TicketStatus.Aberto) {
      history.push({ id: `${s[0]}-h2`, at: minutesAgo(Math.max(2, s[7] * 60 - 10)), author: 'Amanda Ribeiro', text: 'Diagnóstico remoto iniciado. Logs do controlador coletados.', status: TicketStatus.EmDiagnostico });
    }
    if ([TicketStatus.VisitaAgendada, TicketStatus.EmAtendimento, TicketStatus.Resolvido].includes(s[8])) {
      history.push({ id: `${s[0]}-h3`, at: minutesAgo(Math.max(1, s[7] * 60 - 25)), author: 'Amanda Ribeiro', text: 'Visita técnica necessária. Técnico da região acionado.', status: TicketStatus.VisitaAgendada });
    }
    if (s[8] === TicketStatus.Resolvido) {
      history.push({ id: `${s[0]}-h4`, at: minutesAgo(Math.max(1, s[7] * 60 - 50)), author: 'Técnico de campo', text: 'Problema corrigido e validado com a loja.', status: TicketStatus.Resolvido });
    }
    return {
      id: `im-${s[0]}`,
      number: `IM-${s[0]}`,
      kind: s[1],
      client: CLIENT_NAME,
      storeId: s[2],
      equipment: s[3],
      problem: s[4],
      description: s[5],
      priority: s[6],
      slaHours: sla,
      openedAt,
      dueAt: new Date(new Date(openedAt).getTime() + sla * 3_600_000).toISOString(),
      scheduledAt: s[10] !== undefined ? hoursFromNow(s[10]) : undefined,
      technicianId: s[9],
      status: s[8],
      history,
      attachments:
        s[1] === TicketKind.Preventiva
          ? [{ id: `${s[0]}-a1`, name: 'checklist-preventiva.pdf', sizeKb: 184, kind: 'pdf' }]
          : [
              { id: `${s[0]}-a1`, name: `log-${s[3].split(' ').pop()?.toLowerCase()}.txt`, sizeKb: 42, kind: 'log' },
              ...(s[0] % 2 === 0 ? [{ id: `${s[0]}-a2`, name: 'foto-gondola.jpg', sizeKb: 912, kind: 'imagem' as const }] : []),
            ],
    };
  });
