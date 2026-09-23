import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={<Compass />}
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi movido."
        action={
          <Link to="/">
            <Button variant="outline">Voltar para a visão geral</Button>
          </Link>
        }
      />
    </Card>
  );
}
