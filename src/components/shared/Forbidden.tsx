import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from './EmptyState';

export function Forbidden() {
  return (
    <Card>
      <EmptyState icon={<Lock />} title="Acesso restrito" description="Seu perfil não possui permissão para acessar este módulo. Solicite acesso ao administrador da sua rede." />
    </Card>
  );
}
