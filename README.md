# Agenda Promo — Agendamento de Degustações em Clientes

Protótipo funcional (front-end) de uma plataforma interna para solicitar, atribuir e executar
degustações em clientes. Todos os dados são fictícios e ficam no navegador (`localStorage`); não há backend.

**Fluxo:** Vendedor solicita → Gestora de promotores define o promotor → Promotor executa e finaliza.

## Como executar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # checagem TypeScript + build de produção
```

O login já vem preenchido (a tela tem atalhos por perfil). No topo, **Visualizar como** alterna entre
Vendedor, Gestora, Promotor e Administrador. **Configurações → Restaurar** volta aos dados iniciais.

> “Hoje” no protótipo é fixo em **08/10/2026** (configurável em Configurações) para manter os dados
> coerentes. Antecedência mínima padrão: 3 dias → primeira data reservável: 11/10.

## Roteiro da demonstração (fluxo completo)

1. Entrar como **Vendedor** (João Silva) → **Agendar degustação**.
2. Buscar “miguel” (ou código, CNPJ, cidade, bairro) e **Selecionar** o cliente — dados bloqueados.
3. **Data**: calendário verde/amarelo/vermelho/cinza; use “Próxima data disponível”, escolha horário/duração.
   (Dia 16/10 é vermelho; 15/10 tem poucas vagas; tente um horário que conflite para ver as validações.)
4. **Ação**: tipo, marca, produtos, materiais, observações → **Confirmação** → **Confirmar solicitação**.
5. Trocar para **Gestora** → Agendamentos → **Definir promotor** → *Selecionar* (Carlos Lima) → **Confirmar promotor**.
6. Trocar para **Promotor** (Carlos Lima) → ver a ação em “Próximos dias” → **Iniciar ação** → **Finalizar ação**.
7. Voltar a **Vendedor** → Agendamentos → status **FINALIZADA** (com pessoas atendidas).

Também disponíveis: sino de notificações por perfil (com “simular notificação”), solicitação/confirmação
de cancelamento, calendário com contagem por dia, agenda dos promotores, histórico com filtros,
importação simulada de clientes (CSV/XLSX), administração (usuários, clientes, promotores, vendedores,
produtos, marcas e tipos de ação) e regras configuráveis (antecedência mínima, capacidade por promotor).

## Stack e estrutura

React 18 · TypeScript · Vite · Tailwind CSS · Lucide Icons.

```
src/
  data/        catálogo (clientes, vendedores, promotores, marcas, produtos) e seed de degustações
  lib/         datas (pt-BR), regras de disponibilidade/conflito, status
  store.tsx    estado global + ações (persistência em localStorage)
  components/  UI, layout, detalhe da degustação, diálogos, tabela, calendário
  pages/       Login, Dashboard (3 visões), Agendamentos, Novo agendamento, Calendário,
               Clientes, Promotores, Histórico, Administração, Configurações
```

Para integrar a um backend, as ações de `store.tsx` são o ponto único de mutação; a base de clientes
(CODCLI) poderá vir de planilha, ERP WinThor ou API.
