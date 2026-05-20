# Portal do Financiamento

Sistema web moderno para acompanhamento de financiamento imobiliário em tempo real.

## Stack

- **Next.js 15** – App Router
- **TypeScript** – tipagem estática
- **TailwindCSS** – estilização
- **Prisma ORM** – banco de dados
- **SQLite** (dev) / **PostgreSQL/Supabase** (produção)
- **Framer Motion** – animações
- **Shadcn/UI** – componentes
- **Lucide Icons** – ícones
- **jose** – JWT (auth sem dependência pesada)
- **bcryptjs** – hash de senhas

---

## Pré-requisitos

- Node.js 18+
- npm ou yarn

---

## Instalação

### 1. Clone e instale dependências

```bash
cd portal-financiamento
npm install
```

### 2. Configure o ambiente

```bash
cp .env.example .env
```

O `.env` padrão usa SQLite (zero-config para desenvolvimento):

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-secreta-super-segura"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Crie o banco e rode as migrações

```bash
npm run db:generate   # gera o Prisma Client
npm run db:push       # cria as tabelas no banco
```

### 4. Popule com dados iniciais (seed)

```bash
npm run db:seed
```

Isso cria:
- **Admin:** `admin@portalfinancimento.com` / `admin123`
- **Cliente demo:** `joao.silva@email.com` / `cliente123`

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── api/
│   │   ├── auth/login/         # POST - login
│   │   ├── auth/logout/        # POST - logout
│   │   ├── auth/me/            # GET - sessão atual
│   │   ├── clientes/           # CRUD de clientes
│   │   ├── etapas/[id]/        # PATCH - atualizar etapa
│   │   ├── admin/stats/        # GET - estatísticas admin
│   │   └── dashboard/          # GET - dados do cliente logado
│   ├── login/                  # Página de login
│   ├── dashboard/              # Área do cliente
│   └── admin/                  # Área administrativa
│       └── clientes/
│           ├── novo/           # Criar cliente
│           └── [id]/           # Editar cliente + etapas
├── components/
│   ├── ui/                     # Primitivos (Button, Input, Card, etc.)
│   ├── auth/                   # LoginForm
│   ├── dashboard/              # Timeline, ProgressBar, ClientInfo
│   ├── admin/                  # StatsCards, ClientTable, EditStepForm
│   └── layout/                 # Header, AdminSidebar
├── hooks/                      # useAuth, useFinanciamento
├── lib/                        # prisma.ts, auth.ts, utils.ts
├── services/                   # clienteService, etapaService
├── types/                      # Tipos TypeScript
└── middleware.ts               # Proteção de rotas
```

---

## Páginas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/login` | Público | Login com email e senha |
| `/dashboard` | Cliente | Timeline + progresso do financiamento |
| `/admin` | Admin | Dashboard com stats + lista de clientes |
| `/admin/clientes` | Admin | Lista completa de clientes |
| `/admin/clientes/novo` | Admin | Cadastrar novo cliente |
| `/admin/clientes/[id]` | Admin | Editar cliente e suas etapas |

---

## Etapas do Financiamento

As 6 etapas são criadas automaticamente para cada cliente:

1. **Aprovação** – aprovação bancária do crédito
2. **Aprovação Engenharia** – vistoria técnica do imóvel
3. **Assinatura de Contrato** – assinatura do contrato de financiamento
4. **ITBI** – imposto de transmissão de bens imóveis
5. **Registro** – registro em cartório
6. **Entrega das Chaves** – entrega do imóvel

Cada etapa possui: `aguardando | em_andamento | concluído`

---

## Funcionalidades

### Área do Cliente
- Login seguro com email/senha
- Timeline visual animada do processo
- Barra de progresso com percentual
- Contador de dias em cada etapa
- Edição de email e telefone
- Dark mode

### Área Administrativa
- Dashboard com estatísticas gerais
- CRUD completo de clientes
- Edição de dados do cliente
- Atualização de etapas (status, observações, datas)
- Observações internas (visíveis apenas ao admin)
- Histórico de alterações
- Dark mode

---

## Deploy em Produção (Vercel + Supabase)

### 1. Crie um banco PostgreSQL no Supabase

Copie a connection string e atualize o `.env.production`:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
JWT_SECRET="chave-ultra-secreta-producao"
NEXT_PUBLIC_APP_URL="https://seudominio.com"
```

### 2. Rode as migrações no banco de produção

```bash
npx prisma migrate deploy
npm run db:seed
```

### 3. Deploy na Vercel

```bash
npx vercel --prod
```

Configure as variáveis de ambiente no painel da Vercel.

---

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Inicia servidor de produção |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:push` | Sincroniza schema com o banco |
| `npm run db:migrate` | Cria e aplica migrações |
| `npm run db:seed` | Popula o banco com dados iniciais |
| `npm run db:studio` | Abre o Prisma Studio (UI do banco) |

---

## Segurança

- Senhas hasheadas com **bcryptjs** (salt rounds: 12)
- Sessão via **JWT** em cookie HTTP-only
- Middleware de autenticação em todas as rotas protegidas
- Separação de roles: `admin` vs `cliente`
- Clientes só acessam seus próprios dados
