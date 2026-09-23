import { AuditAction, type AuditEvent } from '@/types';
import { minutesAgo } from '@/utils/time';

type AuditSeed = [
  minutes: number,
  userId: string | undefined,
  userName: string,
  action: AuditAction,
  summary: string,
  previousValue: string | undefined,
  newValue: string | undefined,
  storeId: string | undefined,
  deviceRef: string | undefined,
  origin: string,
];

const A = AuditAction;

const seeds: AuditSeed[] = [
  [6, 'u01', 'Daniel Souza', A.AlteracaoPreco, 'Daniel alterou o preço de Renata Espaguete', 'R$ 5,49', 'R$ 4,99', 'lj001', 'G07-P03', '177.84.12.40 · Web'],
  [6, undefined, 'Sistema', A.PublicacaoRegua, 'Sistema publicou conteúdo na régua G07-P03', 'Versão 41', 'Versão 42', 'lj001', 'G07-P03', 'iMart Sync'],
  [14, 'u03', 'Marcos Tavares', A.AprovacaoPreco, 'Gerente aprovou alteração de preço de Zaeli Maizena', 'R$ 5,29', 'R$ 4,99', 'lj001', undefined, '187.19.4.221 · Web'],
  [22, 'u05', 'Lucas Almeida', A.AjustePosicao, 'Lucas ajustou a posição de Renata Parafuso na régua G07-P04', '640 mm', '680 mm', 'lj001', 'G07-P04', '177.84.12.61 · Web'],
  [35, 'u02', 'Carolina Mendes', A.AprovacaoCampanha, 'Gerente aprovou campanha Semana Selmi', 'Aguardando aprovação', 'Ativa', undefined, undefined, '189.40.77.12 · Web'],
  [38, undefined, 'Sistema', A.Dispositivo, 'Sistema detectou 4 réguas offline na Loja Dourados', 'Online', 'Offline', 'lj013', 'CTL-013-G02', 'Monitoramento'],
  [45, 'u06', 'Bianca Ferreira', A.AlteracaoPreco, 'Bianca solicitou reajuste em massa de Erva-Mate Barão', '2 produtos', 'Aguardando aprovação', undefined, undefined, '200.155.3.18 · Web'],
  [52, 'u08', 'Amanda Ribeiro', A.Alerta, 'Amanda reconheceu o alerta "Loja Dourados com 4 réguas offline"', 'Aberto', 'Reconhecido', 'lj013', undefined, '177.84.12.90 · Web'],
  [60, 'u08', 'Amanda Ribeiro', A.Chamado, 'Amanda abriu o chamado IM-1047', undefined, 'Visita agendada', 'lj013', 'CTL-013-G02', '177.84.12.90 · Web'],
  [75, 'u07', 'Rafael Costa', A.CriacaoCampanha, 'Rafael criou a campanha Pet Day — Gatos', undefined, 'Aguardando aprovação', undefined, undefined, '201.17.88.3 · Web'],
  [90, undefined, 'Sistema', A.PublicacaoRegua, 'Sistema publicou lote de preços #PB-2291', undefined, '46 de 50 réguas', 'lj013', undefined, 'iMart Sync'],
  [118, 'u04', 'Fernanda Rocha', A.AprovacaoPreco, 'Gerente aprovou alteração de preço de Qualimax Refresco Laranja', 'R$ 0,99', 'R$ 0,79', 'lj006', undefined, '189.6.44.101 · App'],
  [140, 'u05', 'Lucas Almeida', A.PublicacaoRegua, 'Lucas publicou conteúdo na régua G03-P02', 'Versão 17', 'Versão 18', 'lj002', 'G03-P02', '177.84.12.61 · Web'],
  [190, 'u01', 'Daniel Souza', A.Configuracao, 'Daniel alterou o limite de aprovação de preços', '15%', '10%', undefined, undefined, '177.84.12.40 · Web'],
  [240, 'u09', 'Henrique Lopes', A.Dispositivo, 'Henrique substituiu o controlador CTL-001-G04', 'SN 88213', 'SN 90417', 'lj001', 'CTL-001-G04', 'App técnico'],
  [320, 'u02', 'Carolina Mendes', A.Usuario, 'Carolina convidou Tatiane Borges (Marketing)', undefined, 'Convidado', undefined, undefined, '189.40.77.12 · Web'],
  [410, 'u03', 'Marcos Tavares', A.AprovacaoCampanha, 'Gerente aprovou campanha Relâmpago Maizena 17h–19h', 'Aguardando aprovação', 'Agendada', 'lj001', undefined, '187.19.4.221 · Web'],
  [520, 'u12', 'Diretoria Comercial', A.Login, 'Diretoria Comercial acessou a plataforma', undefined, undefined, undefined, undefined, '200.201.4.10 · Web'],
  [610, undefined, 'Sistema', A.Dispositivo, 'Sistema atualizou firmware de 38 réguas para led-1.14.3', 'led-1.13.8', 'led-1.14.3', 'lj010', undefined, 'OTA'],
  [700, 'u06', 'Bianca Ferreira', A.AlteracaoPreco, 'Bianca alterou o preço de Barão Tereré Menta', 'R$ 13,49', 'R$ 11,99', 'lj009', undefined, '200.155.3.18 · Web'],
  [880, 'u05', 'Lucas Almeida', A.AjustePosicao, 'Lucas ajustou a largura do bloco de Galo Penne na régua G07-P03', '200 mm', '220 mm', 'lj001', 'G07-P03', '177.84.12.61 · Web'],
  [1300, 'u02', 'Carolina Mendes', A.Usuario, 'Carolina bloqueou o usuário Sérgio Pacheco', 'Ativo', 'Bloqueado', 'lj013', undefined, '189.40.77.12 · Web'],
  [1500, 'u01', 'Daniel Souza', A.Configuracao, 'Daniel ativou a exigência de aprovação de gerente', 'Desativado', 'Ativado', undefined, undefined, '177.84.12.40 · Web'],
];

export const auditSeed = (): AuditEvent[] =>
  seeds.map((s, i) => ({
    id: `au-${String(i + 1).padStart(4, '0')}`,
    at: minutesAgo(s[0]),
    userId: s[1],
    userName: s[2],
    action: s[3],
    summary: s[4],
    previousValue: s[5],
    newValue: s[6],
    storeId: s[7],
    deviceRef: s[8],
    origin: s[9],
  }));
