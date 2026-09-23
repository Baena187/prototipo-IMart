import { Check, CircleCheck, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/overlay';
import type { PublishResult } from '@/services';
import { cn } from '@/utils/cn';

const STEPS = ['Validando conteúdo e preços', 'Enviando ao controlador da gôndola', 'Aguardando confirmação da régua'];

export type PublishPhase = 'confirm' | 'publishing' | 'done';

export function PublishDialog({
  open,
  phase,
  onClose,
  onConfirm,
  shelfCode,
  summary,
  result,
  offline,
}: {
  open: boolean;
  phase: PublishPhase;
  onClose: () => void;
  onConfirm: () => void;
  shelfCode: string;
  summary: { moved: number; prices: number; approvals: number; blocks: number };
  result?: PublishResult;
  offline: boolean;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (phase !== 'publishing') {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 350);
    const t2 = setTimeout(() => setStep(2), 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  return (
    <Dialog
      open={open}
      onClose={phase === 'publishing' ? () => undefined : onClose}
      title={phase === 'done' ? 'Publicado com sucesso' : phase === 'publishing' ? 'Publicando…' : `Publicar régua ${shelfCode}`}
      description={phase === 'confirm' ? 'O conteúdo será exibido imediatamente na régua da loja.' : undefined}
      size="sm"
      footer={
        phase === 'confirm' ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Voltar
            </Button>
            <Button onClick={onConfirm}>Publicar agora</Button>
          </>
        ) : phase === 'done' ? (
          <>
            <Link to="/auditoria">
              <Button variant="outline">Ver na auditoria</Button>
            </Link>
            <Button onClick={onClose}>Concluir</Button>
          </>
        ) : undefined
      }
    >
      {phase === 'confirm' && (
        <ul className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <li className="flex justify-between">
            <span>Blocos na régua</span>
            <span className="font-medium tabular-nums">{summary.blocks}</span>
          </li>
          <li className="flex justify-between">
            <span>Blocos reposicionados ou alterados</span>
            <span className="font-medium tabular-nums">{summary.moved}</span>
          </li>
          <li className="flex justify-between">
            <span>Alterações de preço</span>
            <span className="font-medium tabular-nums">{summary.prices}</span>
          </li>
          {summary.approvals > 0 && (
            <li className="rounded bg-amber-50 px-2 py-1.5 text-[13px] text-amber-900">
              {summary.approvals} alteração(ões) acima do limite serão enviadas para aprovação do gerente antes de irem para a régua.
            </li>
          )}
          {offline && <li className="rounded bg-red-50 px-2 py-1.5 text-[13px] text-red-800">A régua está offline. O conteúdo ficará na fila e será entregue quando a comunicação voltar.</li>}
        </ul>
      )}
      {phase === 'publishing' && (
        <ol className="space-y-3 py-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-400')}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i === step ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <span className="text-[11px]">{i + 1}</span>}
              </span>
              <span className={cn(i <= step ? 'text-slate-900' : 'text-slate-400')}>{label}</span>
            </li>
          ))}
        </ol>
      )}
      {phase === 'done' && result && (
        <div className="flex items-start gap-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p>
              Régua <strong>{shelfCode}</strong> {result.offline ? 'atualizada na fila de envio' : 'atualizada e confirmada pelo controlador'}.
            </p>
            <p className="mt-1 text-emerald-800">
              {result.published} preço(s) publicado(s)
              {result.pendingApproval > 0 && ` · ${result.pendingApproval} aguardando aprovação`}. Evento registrado na auditoria.
            </p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
