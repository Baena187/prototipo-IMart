import { cn } from '@/utils/cn';

/** Placeholder de imagem de produto: embalagem estilizada com a cor da marca. */
export function ProductThumb({ brand, color, size = 'md', className }: { brand: string; color: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dims = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-10 w-10' : 'h-24 w-24';
  return (
    <div className={cn('relative flex shrink-0 items-end justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50', dims, className)} aria-hidden>
      <div
        className={cn('mb-[12%] flex w-[58%] flex-col items-center justify-start rounded-[3px]', size === 'lg' ? 'h-[70%]' : 'h-[72%]')}
        style={{ backgroundColor: color }}
      >
        <div className="mt-[18%] h-[22%] w-[78%] rounded-[2px] bg-white/85" />
        {size === 'lg' && <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-white/90">{brand}</span>}
      </div>
    </div>
  );
}
