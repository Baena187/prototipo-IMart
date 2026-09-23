import { AlertCategory, AlertSeverity, AlertStatus, VisionEventType, type Alert, type VisionEvent } from '@/types';
import { minutesAgo } from '@/utils/time';

type AlertSeed = [
  title: string,
  description: string,
  severity: AlertSeverity,
  category: AlertCategory,
  status: AlertStatus,
  storeId: string,
  minutes: number,
  deviceRef?: string,
  assigneeId?: string,
  link?: string,
];

const seeds: AlertSeed[] = [
  ['Régua G07-P03 offline há 12 minutos', 'A régua deixou de enviar heartbeat ao controlador CTL-006-G07. Conteúdo exibido pode estar desatualizado.', AlertSeverity.Critico, AlertCategory.Dispositivo, AlertStatus.Aberto, 'lj006', 12, 'G07-P03', undefined, '/reguas/lj006-g07-p03/editor'],
  ['Baixo estoque — Renata Espaguete', 'A câmera da gôndola G-07 identificou ocupação de 18% na frente do produto (prateleira 3).', AlertSeverity.Atencao, AlertCategory.Estoque, AlertStatus.Aberto, 'lj001', 9, 'G07-P03', undefined, '/gondolas/lj001-g07'],
  ['Câmera CAM-021 sem comunicação', 'Sem imagens processadas há mais de 1 hora. Verificar alimentação PoE e cabo de rede.', AlertSeverity.Critico, AlertCategory.Camera, AlertStatus.Reconhecido, 'lj009', 64, 'CAM-021', 'u11'],
  ['Produto fora da posição prevista', 'Barão Tereré Menta identificado na prateleira 2, planograma prevê prateleira 4.', AlertSeverity.Informativo, AlertCategory.Posicionamento, AlertStatus.Aberto, 'lj002', 31],
  ['Publicação de preços parcialmente concluída', 'Lote #PB-2291: 46 de 50 réguas atualizadas. 4 réguas da Loja Dourados não confirmaram recebimento.', AlertSeverity.Atencao, AlertCategory.Publicacao, AlertStatus.Aberto, 'lj013', 41],
  ['Loja Dourados com 4 réguas offline', 'Queda simultânea em 2 gôndolas sugere falha no controlador ou na alimentação do circuito.', AlertSeverity.Critico, AlertCategory.Dispositivo, AlertStatus.Reconhecido, 'lj013', 38, 'CTL-013-G02', 'u08'],
  ['Serviço de sincronização com atraso', 'SYNC-013 com fila de 37 mensagens pendentes. Latência média de 94 s.', AlertSeverity.Atencao, AlertCategory.Publicacao, AlertStatus.Aberto, 'lj013', 36, 'SYNC-013'],
  ['Régua G11-P02 offline há 47 minutos', 'Última comunicação às 47 minutos. Controlador responde normalmente.', AlertSeverity.Atencao, AlertCategory.Dispositivo, AlertStatus.Aberto, 'lj006', 47, 'G11-P02', 'u10'],
  ['Possível ruptura — Barão Erva-Mate Tradicional', 'Espaço vazio detectado na frente do produto, prateleira 2 da gôndola G-06.', AlertSeverity.Atencao, AlertCategory.Estoque, AlertStatus.Aberto, 'lj005', 18],
  ['Possível ruptura — Qualimax Refresco Laranja', 'Frente sem produto identificada em 2 leituras consecutivas.', AlertSeverity.Atencao, AlertCategory.Estoque, AlertStatus.Aberto, 'lj007', 26],
  ['Temperatura elevada no controlador CTL-003-G03', 'Temperatura registrada de 58 °C (limite 55 °C).', AlertSeverity.Atencao, AlertCategory.Dispositivo, AlertStatus.Aberto, 'lj003', 22, 'CTL-003-G03'],
  ['Produto não reconhecido na gôndola G-09', 'Embalagem sem correspondência no catálogo. Possível produto de outro fornecedor.', AlertSeverity.Informativo, AlertCategory.Posicionamento, AlertStatus.Aberto, 'lj012', 55],
  ['Gôndola G-05 com baixa exposição', 'Ocupação média de 61% nas últimas 3 horas no corredor de Biscoitos.', AlertSeverity.Informativo, AlertCategory.Estoque, AlertStatus.Aberto, 'lj004', 73],
  ['Régua G10-P03 offline', 'Sem heartbeat há mais de 1 hora. Chamado técnico sugerido.', AlertSeverity.Critico, AlertCategory.Dispositivo, AlertStatus.Aberto, 'lj002', 95, 'G10-P03'],
  ['Firmware desatualizado em 14 réguas', 'Versão led-1.13.8 identificada. Atualização disponível: led-1.14.3.', AlertSeverity.Informativo, AlertCategory.Dispositivo, AlertStatus.Aberto, 'lj011', 180],
  ['Divergência de preço PDV × régua', 'Galo Espaguete: R$ 4,29 no PDV e R$ 4,49 na régua G02-P04.', AlertSeverity.Atencao, AlertCategory.Publicacao, AlertStatus.Aberto, 'lj010', 64],
  ['Baixo estoque — Vidan Cães Adultos 15kg', 'Ocupação de 22% na prateleira 1 do corredor Pet Shop.', AlertSeverity.Atencao, AlertCategory.Estoque, AlertStatus.Reconhecido, 'lj012', 120, undefined, 'u03'],
  ['Régua G06-P01 offline em homologação', 'Loja em homologação — régua sem comunicação durante teste de carga.', AlertSeverity.Informativo, AlertCategory.Dispositivo, AlertStatus.Aberto, 'lj016', 22, 'G06-P01'],
  ['Câmera com imagem desfocada', 'Índice de nitidez abaixo do limite na câmera do corredor de Massas.', AlertSeverity.Atencao, AlertCategory.Camera, AlertStatus.Aberto, 'lj003', 140],
  ['Campanha "Semana Selmi" com 3 réguas pendentes', 'Conteúdo aguardando confirmação de recebimento na Loja Brasília Norte.', AlertSeverity.Informativo, AlertCategory.Publicacao, AlertStatus.Aberto, 'lj006', 16],
  ['Produto fora da posição — Zaeli Molho Pizza', 'Produto detectado na gôndola G-01, previsto para G-03.', AlertSeverity.Informativo, AlertCategory.Posicionamento, AlertStatus.Resolvido, 'lj001', 300],
  ['Régua G03-P01 com oscilação de brilho', 'Variação de corrente detectada. Possível mau contato no conector.', AlertSeverity.Atencao, AlertCategory.Dispositivo, AlertStatus.Aberto, 'lj003', 4, 'G03-P01'],
  ['Gateway GW-013-1 com perda de pacotes', 'Perda média de 7,8% nos últimos 30 minutos.', AlertSeverity.Atencao, AlertCategory.Dispositivo, AlertStatus.Aberto, 'lj013', 34, 'GW-013-1'],
  ['Possível ruptura — Renata Penne', 'Ruptura confirmada por 3 leituras. Reposição sugerida.', AlertSeverity.Critico, AlertCategory.Estoque, AlertStatus.Resolvido, 'lj001', 420],
];

export const alertsSeed = (): Alert[] =>
  seeds.map((s, i) => ({
    id: `al-${String(i + 1).padStart(3, '0')}`,
    title: s[0],
    description: s[1],
    severity: s[2],
    category: s[3],
    status: s[4],
    storeId: s[5],
    createdAt: minutesAgo(s[6]),
    deviceRef: s[7],
    assigneeId: s[8],
    acknowledgedAt: s[4] !== AlertStatus.Aberto ? minutesAgo(Math.max(1, s[6] - 5)) : undefined,
    resolvedAt: s[4] === AlertStatus.Resolvido ? minutesAgo(Math.max(1, s[6] - 60)) : undefined,
    notes:
      s[4] === AlertStatus.Reconhecido
        ? [{ id: `n-${i}`, author: 'Amanda Ribeiro', text: 'Diagnóstico remoto iniciado. Técnico da região acionado.', createdAt: minutesAgo(Math.max(1, s[6] - 8)) }]
        : [],
    link: s[9],
  }));

type VisionSeed = [cameraCode: string, storeId: string, type: VisionEventType, productId: string | undefined, level: number, minutes: number, confidence: number, resolved?: boolean];

const visionSeeds: VisionSeed[] = [
  ['CAM-002', 'lj001', VisionEventType.BaixoEstoque, 'p016', 3, 9, 0.93],
  ['CAM-001', 'lj001', VisionEventType.ForaDoLocal, 'p012', 2, 21, 0.88],
  ['CAM-004', 'lj001', VisionEventType.PossivelRuptura, 'p018', 4, 34, 0.91],
  ['CAM-006', 'lj001', VisionEventType.BaixaExposicao, undefined, 1, 52, 0.84],
  ['CAM-012', 'lj002', VisionEventType.ForaDoLocal, 'p032', 2, 31, 0.9],
  ['CAM-014', 'lj002', VisionEventType.NaoReconhecido, undefined, 3, 44, 0.62],
  ['CAM-018', 'lj003', VisionEventType.PossivelRuptura, 'p008', 5, 15, 0.87],
  ['CAM-026', 'lj005', VisionEventType.PossivelRuptura, 'p028', 2, 18, 0.95],
  ['CAM-029', 'lj006', VisionEventType.BaixoEstoque, 'p023', 3, 27, 0.89],
  ['CAM-034', 'lj007', VisionEventType.PossivelRuptura, 'p038', 1, 26, 0.92],
  ['CAM-040', 'lj009', VisionEventType.ForaDoLocal, 'p017', 4, 80, 0.81],
  ['CAM-048', 'lj010', VisionEventType.BaixoEstoque, 'p045', 2, 95, 0.86],
  ['CAM-058', 'lj012', VisionEventType.BaixoEstoque, 'p049', 1, 120, 0.9],
  ['CAM-060', 'lj012', VisionEventType.NaoReconhecido, undefined, 3, 55, 0.58],
  ['CAM-052', 'lj004', VisionEventType.BaixaExposicao, undefined, 2, 73, 0.8],
  ['CAM-003', 'lj001', VisionEventType.ForaDoLocal, 'p013', 1, 300, 0.9, true],
  ['CAM-002', 'lj001', VisionEventType.PossivelRuptura, 'p018', 3, 420, 0.94, true],
  ['CAM-066', 'lj014', VisionEventType.BaixoEstoque, 'p036', 2, 150, 0.83],
];

export interface VisionSeedResolved {
  cameraCode: string;
  event: Omit<VisionEvent, 'cameraId' | 'gondolaId'>;
}

export const visionSeedsResolved = (): VisionSeedResolved[] =>
  visionSeeds.map((s, i) => ({
    cameraCode: s[0],
    event: {
      id: `ve-${String(i + 1).padStart(3, '0')}`,
      storeId: s[1],
      type: s[2],
      productId: s[3],
      shelfLevel: s[4],
      detectedAt: minutesAgo(s[5]),
      confidence: s[6],
      resolved: s[7] ?? false,
    },
  }));

