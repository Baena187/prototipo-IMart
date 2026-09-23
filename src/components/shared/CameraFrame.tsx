import { VideoOff } from 'lucide-react';
import type { Camera } from '@/types';
import { DeviceStatus } from '@/types';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import { createRng } from '@/utils/random';

const PALETTE = ['#cbd5e1', '#b6c2d1', '#d6c7a8', '#c9b4a3', '#b8c9b5', '#c6bfd6', '#d4b8b8'];

/** Placeholder do quadro da câmera: esquema da gôndola com marcações de ruptura e posição. */
export function CameraFrame({ camera, className, large }: { camera: Camera; className?: string; large?: boolean }) {
  const offline = camera.status === DeviceStatus.Offline;
  const rng = createRng(camera.code.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const rows = 5;
  const W = 320;
  const H = 180;
  const shelfH = H / rows;
  let ruptures = camera.ruptureCount;
  let misplaced = camera.misplacedCount;

  return (
    <div className={cn('relative overflow-hidden rounded-md bg-slate-800', className)} style={{ aspectRatio: '16 / 9' }}>
      {offline ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
          <VideoOff className="h-6 w-6" />
          <span className="text-xs font-medium uppercase tracking-wide">Sem sinal</span>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
          <rect width={W} height={H} fill="#e2e8f0" />
          {Array.from({ length: rows }).map((_, r) => {
            const y = r * shelfH;
            const items: JSX.Element[] = [];
            let x = 6;
            let i = 0;
            while (x < W - 20) {
              const w = rng.int(18, 34);
              const h = shelfH - rng.int(8, 13);
              const isRupture = ruptures > 0 && rng.chance(0.08);
              const isMisplaced = !isRupture && misplaced > 0 && rng.chance(0.06);
              if (isRupture) {
                ruptures--;
                items.push(
                  <rect key={`${r}-${i}`} x={x} y={y + shelfH - h - 3} width={w + 8} height={h} fill="none" stroke="#dc2626" strokeWidth={1.4} strokeDasharray="3 2" />,
                );
                x += w + 10;
              } else {
                items.push(<rect key={`${r}-${i}`} x={x} y={y + shelfH - h - 3} width={w} height={h} rx={1.5} fill={PALETTE[rng.int(0, PALETTE.length - 1)]} />);
                if (isMisplaced) {
                  misplaced--;
                  items.push(<rect key={`${r}-${i}-m`} x={x - 1.5} y={y + shelfH - h - 4.5} width={w + 3} height={h + 3} fill="none" stroke="#d97706" strokeWidth={1.4} />);
                }
                x += w + 2;
              }
              i++;
            }
            return (
              <g key={r}>
                {items}
                <rect x={0} y={y + shelfH - 3} width={W} height={3} fill="#64748b" />
              </g>
            );
          })}
        </svg>
      )}
      <div className={cn('absolute left-2 top-2 flex items-center gap-1.5 rounded bg-slate-900/70 px-1.5 py-0.5 font-mono text-white', large ? 'text-xs' : 'text-[10px]')}>
        <span className={cn('h-1.5 w-1.5 rounded-full', offline ? 'bg-slate-400' : 'bg-red-500')} />
        {camera.code}
      </div>
      <div className={cn('absolute bottom-2 right-2 rounded bg-slate-900/70 px-1.5 py-0.5 font-mono text-white/90', large ? 'text-xs' : 'text-[10px]')}>
        {formatDateTime(camera.lastProcessedAt)}
      </div>
    </div>
  );
}
