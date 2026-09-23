import { Badge } from '@/components/ui/badge';
import type { StatusMap } from '@/utils/labels';

export function StatusBadge<T extends string>({ map, value, dot = true, className }: { map: StatusMap<T>; value: T; dot?: boolean; className?: string }) {
  const meta = map[value];
  if (!meta) return null;
  return (
    <Badge tone={meta.tone} dot={dot} className={className}>
      {meta.label}
    </Badge>
  );
}
