import { BookOpen, ChevronRight, Clock, Headset, Mail, MessageSquare, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/contexts/ToastContext';

const ARTICLES = [
  { title: 'Como alinhar o preço abaixo do produto na régua', category: 'Réguas digitais' },
  { title: 'Fluxo de aprovação de preços por gerente', category: 'Central de preços' },
  { title: 'Criando uma promoção relâmpago por horário', category: 'Campanhas' },
  { title: 'O que fazer quando uma régua fica offline', category: 'Monitoramento' },
  { title: 'Entendendo os eventos de ruptura das câmeras', category: 'Câmeras' },
  { title: 'Importação de preços via arquivo CSV', category: 'Central de preços' },
];

export default function SupportPage() {
  const toast = useToast();
  return (
    <div>
      <PageHeader title="Central de suporte" description="Atendimento iMart para operação, dúvidas de uso e ocorrências técnicas." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { icon: Phone, title: 'Telefone 24/7', text: '0800 000 4627', action: 'Ligar' },
          { icon: Mail, title: 'E-mail', text: 'suporte@imart.com.br', action: 'Enviar e-mail' },
          { icon: MessageSquare, title: 'Atendimento por mensagem', text: 'Seg. a sáb., 07:00 às 22:00', action: 'Iniciar conversa' },
        ].map((c) => (
          <Card key={c.title}>
            <CardContent>
              <c.icon className="h-5 w-5 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-900">{c.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">{c.text}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => toast.info(c.action, 'Canal disponível no ambiente de produção.')}>
                {c.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title="Base de conhecimento" description="Artigos mais acessados" />
          <ul className="divide-y divide-slate-100">
            {ARTICLES.map((a) => (
              <li key={a.title}>
                <button onClick={() => toast.info(a.title, 'Artigo disponível na base de conhecimento.')} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50">
                  <BookOpen className="h-4 w-4 text-slate-400" />
                  <span className="flex-1">
                    <span className="block text-sm text-slate-900">{a.title}</span>
                    <span className="text-xs text-slate-500">{a.category}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Abrir chamado técnico" />
          <CardContent>
            <Headset className="h-5 w-5 text-slate-400" />
            <p className="mt-3 text-sm text-slate-600">Para falhas em réguas, câmeras ou controladores, registre um chamado. O SLA começa a contar na abertura.</p>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-slate-500">
              <Clock className="h-4 w-4" /> Crítica 2h · Alta 4h · Média 8h · Baixa 24h
            </p>
            <Link to="/operacoes">
              <Button className="mt-4 w-full">Ir para a Central de operações</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
