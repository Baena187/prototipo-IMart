# iMart Control — protótipo navegável

**iMart** · Gestão inteligente para o ponto de venda.

Protótipo front-end da plataforma de gestão de gôndolas inteligentes: réguas digitais de LED
contínuas, preços dinâmicos, campanhas, câmeras com visão computacional, monitoramento de
dispositivos e operação do serviço iMart para múltiplas lojas.

> Todos os dados são fictícios e ficam no navegador (localStorage). Não há backend.

## Como executar

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. O login já vem preenchido (qualquer e-mail/senha com 4+ caracteres
funciona). Outros scripts:

| Comando | Descrição |
| --- | --- |
| `npm run build` | Checagem TypeScript (`tsc -b`) + build de produção |
| `npm run preview` | Serve o build de produção |
| `npm run typecheck` | Somente checagem de tipos |

Para voltar ao estado inicial da demonstração: **Configurações → Restaurar dados**.

## Roteiro sugerido de demonstração

1. **Visão geral** → clique em *Status da operação* › Loja Goiânia Centro.
2. **Loja** → *Ver gôndolas* › **Gôndola G-07** (representação visual das prateleiras).
3. Clique na prateleira **G07-P03** → **editor da régua**:
   selecione um produto, use *Mover para direita/esquerda* ou arraste o bloco, clique *Alinhar*,
   informe um *Novo preço*, *Pré-visualizar* e **Publicar** (Publicando… → Publicado com sucesso).
4. **Auditoria** → o evento da publicação e da alteração de preço aparece no topo.
5. **Preços** → aba *Aguardando aprovação* → selecionar → *Aprovar* → *Publicar*.
6. **Campanhas** → *Nova campanha* com preview da régua em tempo real.
7. Menu do usuário (canto superior direito) → *Perfil de demonstração* para ver o RBAC
   (ex.: *Visualização* deixa o editor somente leitura).

Atalhos: `Ctrl/⌘ + K` pesquisa global · setas ←/→ movem o bloco selecionado no editor ·
`Ctrl/⌘ + Z` desfaz.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · componentes próprios no padrão shadcn/ui ·
Lucide Icons · Recharts · React Router.

## Arquitetura

```
src/
  components/
    ui/          primitivas (Button, Badge, Dialog, Sheet, Tabs, Switch…)
    shared/      DataTable, FilterBar, StatusBadge, PageHeader, StatCard, Timeline…
    shelf/       ShelfStrip (renderização da régua LED), SlotInspector, diálogos de publicação
    layout/      Sidebar, Topbar, CommandPalette, navegação
  contexts/      Auth (sessão + RBAC), Toast, loja selecionada
  data/          mocks determinísticos (lojas, produtos, rede de dispositivos, alertas…)
  hooks/         useQuery (revalidação automática), usePriceBook, usePagination…
  layouts/       AppLayout
  pages/         uma pasta por módulo
  services/      camada de serviços assíncrona (substituível por API REST)
  types/         enums e interfaces de domínio
  utils/         formatação pt-BR, labels de status, regras da régua, permissões
```

- **Serviços** (`src/services/*.service.ts`) expõem funções assíncronas com latência simulada.
  Para integrar uma API real, basta reimplementar essas funções mantendo as assinaturas.
- **Persistência** (`services/db.ts`): cada coleção nasce de um seed determinístico e grava no
  localStorage apenas as alterações feitas na demonstração.
- **RBAC**: perfis e permissões em `data/users.ts`; `useAuth().can(permission)` controla menus e ações.

Fora do escopo desta etapa (arquitetura preparada): visão computacional real, protocolo das
réguas LED, websocket de hardware, integração ERP, cobrança, autenticação real e infraestrutura cloud.
