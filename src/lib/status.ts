import type { Status } from '../types';

export const STATUS_ORDER: Status[] = ['SOLICITADA', 'AGUARDANDO_PROMOTOR', 'PROMOTOR_DEFINIDO', 'CONFIRMADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'];

export const STATUS_LABEL: Record<Status, string> = {
  SOLICITADA: 'Solicitada',
  AGUARDANDO_PROMOTOR: 'Aguardando promotor',
  PROMOTOR_DEFINIDO: 'Promotor definido',
  CONFIRMADA: 'Confirmada',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

export const STATUS_STYLE: Record<Status, { badge: string; dot: string }> = {
  SOLICITADA: { badge: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-400' },
  AGUARDANDO_PROMOTOR: { badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  PROMOTOR_DEFINIDO: { badge: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
  CONFIRMADA: { badge: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  EM_ANDAMENTO: { badge: 'bg-accent-50 text-accent-700 ring-accent-200', dot: 'bg-accent-500' },
  FINALIZADA: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  CANCELADA: { badge: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
};

export const isOpen = (s: Status) => s !== 'FINALIZADA' && s !== 'CANCELADA';
export const isPending = (s: Status) => s === 'SOLICITADA' || s === 'AGUARDANDO_PROMOTOR' || s === 'PROMOTOR_DEFINIDO';
