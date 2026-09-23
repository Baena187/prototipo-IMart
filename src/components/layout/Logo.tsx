import { cn } from '@/utils/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#1d4ed8" />
      <rect x="7" y="9" width="18" height="3" rx="1.5" fill="#fff" />
      <rect x="7" y="14.5" width="18" height="3" rx="1.5" fill="#fff" opacity=".75" />
      <rect x="7" y="20" width="12" height="3" rx="1.5" fill="#fff" opacity=".5" />
    </svg>
  );
}

export function Logo({ subtitle = true, className }: { subtitle?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-tight text-slate-900">
          iMart <span className="font-normal text-slate-500">Control</span>
        </div>
        {subtitle && <div className="text-[11px] text-slate-500">Gestão inteligente para o PDV</div>}
      </div>
    </div>
  );
}
