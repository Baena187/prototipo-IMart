import { Skeleton } from '@/components/ui/misc';

export function PageSkeleton() {
  return (
    <div className="animate-fade-in">
      <Skeleton className="mb-2 h-4 w-40" />
      <Skeleton className="mb-6 h-7 w-72" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[108px]" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}
