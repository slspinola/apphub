# Plano de Implementação — bee2hive

## Visão Geral

O **bee2hive** é o hub central de um ecossistema de aplicações SaaS multi-tenant. Funciona como Identity Provider, gestor de organizações, utilizadores, permissões e licenças para todas as aplicações do ecossistema (bee2fleet, bee2vision, bee2energy, etc.).

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15 + Tailwind CSS + shadcn/ui |
| Backend | Next.js Route Handlers (Node runtime) |
| Base de Dados | Supabase (PostgreSQL) |
| ORM | Prisma |
| Autenticação | NextAuth.js + OAuth Provider customizado |
| Realtime | Supabase Realtime (opcional) |
| Storage | Supabase Storage (para ficheiros/imagens) |
| Deploy | Vercel |
| Multi-tenancy | Row-Level Security (RLS) nativo do Supabase |

---

## Estrutura de Fases

| Fase | Nome | Duração Estimada |
|------|------|------------------|
| 1 | Fundação | 2-3 dias |
| 2 | Autenticação | 3-4 dias |
| 3 | Multi-tenancy | 2-3 dias |
| 4 | Gestão de Utilizadores | 3-4 dias |
| 5 | RBAC (Papéis e Permissões) | 3-4 dias |
| 6 | Licenciamento | 3-4 dias |
| 7 | OAuth Provider | 4-5 dias |
| 8 | Registo de Apps | 2-3 dias |
| 9 | SDK (@bee2/hive-sdk) | 4-5 dias |
| 10 | APIs do Ecossistema | 3-4 dias |
| 11 | Dashboard Administrativo | 5-7 dias |
| 12 | Auditoria e Logs | 2-3 dias |

**Duração total estimada:** 8-10 semanas

---

## Fase 1 — Fundação

**Objectivo:** Configurar a estrutura base do projecto com todas as dependências e configurações necessárias.

### Tarefas

#### 1.1 Inicialização do Projecto
- [ ] Criar projecto Next.js 15 com App Router
- [ ] Configurar TypeScript com strict mode
- [ ] Configurar ESLint e Prettier
- [ ] Configurar path aliases (@/)

#### 1.2 Configuração de Estilos
- [ ] Instalar e configurar Tailwind CSS
- [ ] Instalar e configurar shadcn/ui
- [ ] Definir tema base (cores, tipografia, espaçamentos)
- [ ] Criar componentes de layout base (Container, Card, etc.)

#### 1.3 Configuração da Base de Dados
- [ ] Criar projecto Supabase
- [ ] Instalar Prisma ORM
- [ ] Configurar conexão Supabase com Prisma (connection pooling via Supavisor)
- [ ] Criar schema inicial (modelo User básico para teste)
- [ ] Configurar migrations
- [ ] Testar conexão
- [ ] Configurar Supabase Storage (para avatares e ficheiros)

#### 1.4 Estrutura de Pastas
- [ ] Definir estrutura de pastas do projecto
- [ ] Criar pastas para features/módulos
- [ ] Configurar barrel exports

#### 1.5 Configuração de Ambiente
- [ ] Criar ficheiros .env.example e .env.local
- [ ] Configurar variáveis de ambiente para Supabase
  - [ ] DATABASE_URL (connection pooling)
  - [ ] DIRECT_URL (migrations)
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] Configurar variáveis para NextAuth (preparação)

#### 1.6 Utilitários Base
- [ ] Criar cliente Prisma singleton
- [ ] Criar cliente Supabase (para Storage e funcionalidades adicionais)
- [ ] Criar utilitários de resposta API (success, error)
- [ ] Criar tipos base partilhados
- [ ] Configurar logging básico

### Entregáveis
- Projecto Next.js funcional
- Conexão a Supabase estabelecida
- Schema Prisma inicial migrado
- Cliente Supabase configurado
- Estrutura de pastas definida

### Configuração Prisma + Supabase

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Connection pooling (Supavisor)
  directUrl = env("DIRECT_URL")        // Direct connection (migrations)
}
```

```env
# .env.example

# Supabase Database
DATABASE_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase API
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore em Server Components
          }
        },
      },
    }
  )
}
```

```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

// Cliente com service_role para operações administrativas
// NUNCA expor ao cliente/browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

### Estrutura de Pastas Proposta

```
bee2hive/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── organizations/
│   │   │   ├── users/
│   │   │   ├── licenses/
│   │   │   ├── apps/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── v1/
│   │   │   └── oauth/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── forms/
│   │   ├── tables/
│   │   └── layouts/
│   ├── lib/
│   │   ├── prisma.ts        # Cliente Prisma
│   │   ├── supabase/
│   │   │   ├── client.ts    # Cliente browser
│   │   │   ├── server.ts    # Cliente server
│   │   │   └── admin.ts     # Cliente admin (service role)
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   └── validations/
│   ├── features/
│   │   ├── auth/
│   │   ├── organizations/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── licenses/
│   │   └── apps/
│   ├── hooks/
│   ├── types/
│   └── middleware.ts
├── public/
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Fase 2 — Autenticação

**Objectivo:** Implementar sistema de autenticação completo para utilizadores do bee2hive.

### Tarefas

#### 2.1 Configuração NextAuth.js
- [ ] Instalar NextAuth.js v5 (Auth.js)
- [ ] Configurar providers (Credentials)
- [ ] Configurar adapter Prisma
- [ ] Configurar sessão (JWT strategy)
- [ ] Configurar callbacks (jwt, session)

#### 2.2 Schema de Autenticação
- [ ] Criar/actualizar modelo User
- [ ] Criar modelo Account (OAuth)
- [ ] Criar modelo Session
- [ ] Criar modelo VerificationToken
- [ ] Executar migrations

#### 2.3 Páginas de Autenticação
- [ ] Criar página de login
- [ ] Criar página de registo
- [ ] Criar página de recuperação de password
- [ ] Criar página de reset de password
- [ ] Criar página de verificação de email

#### 2.4 Lógica de Autenticação
- [ ] Implementar registo de utilizador
- [ ] Implementar login com credentials
- [ ] Implementar hash de passwords (bcrypt)
- [ ] Implementar verificação de email
- [ ] Implementar recuperação de password
- [ ] Implementar logout

#### 2.5 Middleware de Autenticação
- [ ] Criar middleware para rotas protegidas
- [ ] Configurar rotas públicas vs privadas
- [ ] Implementar redirect após login

#### 2.6 Componentes de Auth
- [ ] Criar formulário de login
- [ ] Criar formulário de registo
- [ ] Criar componente UserMenu
- [ ] Criar componente de loading/skeleton

### Entregáveis
- Sistema de login/registo funcional
- Verificação de email
- Recuperação de password
- Sessões JWT
- Middleware de protecção de rotas

### Schema Prisma (Autenticação)

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  emailVerified   DateTime?
  passwordHash    String?
  name            String?
  image           String?
  status          UserStatus @default(PENDING_VERIFICATION)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  accounts        Account[]
  sessions        Session[]
  memberships     Membership[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

enum UserStatus {
  PENDING_VERIFICATION
  ACTIVE
  SUSPENDED
  DELETED
}
```

---

## Fase 3 — Multi-tenancy

**Objectivo:** Implementar isolamento de dados por organização usando Row-Level Security.

### Tarefas

#### 3.1 Schema de Organizações
- [ ] Criar modelo Organization
- [ ] Criar modelo Membership (relação User-Organization)
- [ ] Criar modelo OrganizationInvite
- [ ] Adicionar campo tenantId onde necessário
- [ ] Executar migrations

#### 3.2 Row-Level Security (RLS)
- [ ] Criar função SQL para obter tenant actual
- [ ] Criar políticas RLS para tabelas multi-tenant
- [ ] Criar script de aplicação de RLS
- [ ] Testar isolamento de dados

#### 3.3 Middleware de Tenant
- [ ] Criar contexto de tenant
- [ ] Implementar extracção de tenant da sessão
- [ ] Criar Prisma middleware para injectar tenantId
- [ ] Implementar validação de acesso a tenant

#### 3.4 CRUD de Organizações
- [ ] Criar organização (durante registo ou depois)
- [ ] Actualizar organização
- [ ] Listar organizações do utilizador
- [ ] Alternar entre organizações (switch tenant)

#### 3.5 Sistema de Convites
- [ ] Criar convite para organização
- [ ] Enviar email de convite
- [ ] Aceitar convite
- [ ] Cancelar/expirar convite
- [ ] Listar convites pendentes

### Entregáveis
- Modelo de organizações
- RLS implementado e testado
- Middleware de tenant
- Sistema de convites funcional

### Schema Prisma (Multi-tenancy)

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  logo        String?
  settings    Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  memberships Membership[]
  invites     OrganizationInvite[]
  licenses    License[]
}

model Membership {
  id             String   @id @default(cuid())
  userId         String
  organizationId String
  role           String   @default("member")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
}

model OrganizationInvite {
  id             String       @id @default(cuid())
  email          String
  organizationId String
  role           String       @default("member")
  token          String       @unique
  expiresAt      DateTime
  acceptedAt     DateTime?
  createdAt      DateTime     @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([email, organizationId])
}
```

### SQL para RLS (Supabase)

O Supabase tem suporte nativo para RLS, facilitando a implementação. As políticas podem ser criadas via Dashboard ou SQL.

```sql
-- Função para obter tenant actual (usando claims do JWT ou variável de sessão)
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS TEXT AS $$
BEGIN
  -- Opção 1: Usar variável de sessão (definida pela aplicação)
  RETURN current_setting('app.current_tenant_id', true);
  
  -- Opção 2: Usar claims do JWT do Supabase Auth (se usar Supabase Auth)
  -- RETURN (auth.jwt() -> 'app_metadata' ->> 'org_id');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS nas tabelas multi-tenant
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "License" ENABLE ROW LEVEL SECURITY;

-- Política para Membership (utilizadores só vêem memberships das suas organizações)
CREATE POLICY "Users can view own memberships" ON "Membership"
  FOR SELECT
  USING (
    user_id = auth.uid()::text 
    OR organization_id = current_tenant_id()
  );

-- Política para organizações (utilizadores só vêem organizações onde são membros)
CREATE POLICY "Users can view own organizations" ON "Organization"
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM "Membership" 
      WHERE user_id = auth.uid()::text
    )
  );

-- Política para licenças (baseada no tenant actual)
CREATE POLICY "Tenant isolation for licenses" ON "License"
  FOR ALL
  USING (organization_id = current_tenant_id());

-- Bypass RLS para service role (usado pelo backend)
-- O Supabase service_role key já bypassa RLS por defeito
```

**Nota:** O Supabase permite gerir RLS visualmente através do Dashboard, o que facilita a criação e manutenção de políticas.

---

## Fase 4 — Gestão de Utilizadores

**Objectivo:** Implementar funcionalidades completas de gestão de utilizadores dentro de uma organização.

### Tarefas

#### 4.1 Listagem de Utilizadores
- [ ] API para listar utilizadores da organização
- [ ] Página de listagem com tabela
- [ ] Paginação
- [ ] Filtros (nome, email, papel, estado)
- [ ] Ordenação

#### 4.2 Detalhes de Utilizador
- [ ] API para obter detalhes do utilizador
- [ ] Página de detalhes/perfil
- [ ] Histórico de actividade (preparação)

#### 4.3 Edição de Utilizador
- [ ] API para actualizar utilizador
- [ ] Formulário de edição
- [ ] Upload de avatar (usando Supabase Storage)
- [ ] Alteração de papel na organização

#### 4.4 Gestão de Estado
- [ ] Suspender utilizador
- [ ] Reactivar utilizador
- [ ] Remover utilizador da organização

#### 4.5 Perfil Próprio
- [ ] Página de perfil pessoal
- [ ] Editar dados pessoais
- [ ] Alterar password
- [ ] Gerir sessões activas
- [ ] Preferências (idioma, timezone, notificações)

#### 4.6 Convites (complemento Fase 3)
- [ ] UI para enviar convites
- [ ] UI para gerir convites pendentes
- [ ] Reenviar convite
- [ ] Revogar convite

### Entregáveis
- CRUD completo de utilizadores
- Gestão de perfil pessoal
- Interface de convites
- Gestão de estados

---

## Fase 5 — RBAC (Papéis e Permissões)

**Objectivo:** Implementar sistema flexível de controlo de acesso baseado em papéis.

### Tarefas

#### 5.1 Schema de RBAC
- [ ] Criar modelo Role
- [ ] Criar modelo Permission
- [ ] Criar relação Role-Permission
- [ ] Actualizar Membership para suportar múltiplos papéis
- [ ] Executar migrations

#### 5.2 Papéis Base
- [ ] Definir papéis predefinidos do sistema
  - [ ] Owner (dono da organização)
  - [ ] Admin (administrador)
  - [ ] Manager (gestor)
  - [ ] Member (membro)
  - [ ] Viewer (apenas leitura)
- [ ] Criar seed com papéis predefinidos
- [ ] Definir hierarquia de papéis

#### 5.3 Permissões Base
- [ ] Definir permissões do bee2hive
  - [ ] organization:* (gerir organização)
  - [ ] users:* (gerir utilizadores)
  - [ ] roles:* (gerir papéis)
  - [ ] licenses:* (gerir licenças)
  - [ ] apps:* (gerir apps)
  - [ ] audit:* (ver auditoria)
- [ ] Associar permissões aos papéis base

#### 5.4 APIs de RBAC
- [ ] CRUD de papéis customizados
- [ ] Atribuir/remover papéis a utilizadores
- [ ] Listar permissões
- [ ] Verificar permissão

#### 5.5 Middleware de Autorização
- [ ] Criar decorator/helper para verificar permissões
- [ ] Implementar verificação em Route Handlers
- [ ] Implementar verificação em Server Components

#### 5.6 UI de Gestão de Papéis
- [ ] Página de listagem de papéis
- [ ] Criar/editar papel customizado
- [ ] Matriz de permissões
- [ ] Atribuir papéis a utilizadores

### Entregáveis
- Sistema RBAC completo
- Papéis predefinidos
- Papéis customizados
- Middleware de autorização
- UI de gestão

### Schema Prisma (RBAC)

```prisma
model Role {
  id             String   @id @default(cuid())
  name           String
  slug           String
  description    String?
  isSystem       Boolean  @default(false)  // Papéis predefinidos
  organizationId String?  // null = papel global do sistema
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization? @relation(fields: [organizationId], references: [id])
  permissions  RolePermission[]
  memberships  MembershipRole[]

  @@unique([slug, organizationId])
}

model Permission {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique  // "users:read", "users:write"
  description String?
  resource    String   // "users", "organizations", etc.
  action      String   // "read", "write", "delete", etc.
  appId       String?  // null = permissão do bee2hive

  app   App? @relation(fields: [appId], references: [id])
  roles RolePermission[]
}

model RolePermission {
  roleId       String
  permissionId String

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}

model MembershipRole {
  membershipId String
  roleId       String

  membership Membership @relation(fields: [membershipId], references: [id], onDelete: Cascade)
  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([membershipId, roleId])
}
```

---

## Fase 6 — Licenciamento

**Objectivo:** Implementar sistema de licenças para controlar acesso às aplicações do ecossistema.

### Tarefas

#### 6.1 Schema de Licenciamento
- [ ] Criar modelo Plan (planos disponíveis)
- [ ] Criar modelo License
- [ ] Criar modelo LicenseFeature (feature flags)
- [ ] Criar modelo UsageRecord (métricas de utilização)
- [ ] Executar migrations

#### 6.2 Planos e Features
- [ ] Definir estrutura de planos por app
- [ ] Definir features/limites por plano
  - [ ] Número de utilizadores
  - [ ] Número de recursos (veículos, câmaras, etc.)
  - [ ] Armazenamento
  - [ ] Features específicas
- [ ] Criar seed com planos exemplo

#### 6.3 APIs de Licenciamento
- [ ] Criar licença para organização
- [ ] Listar licenças da organização
- [ ] Verificar estado da licença
- [ ] Actualizar/renovar licença
- [ ] Cancelar licença
- [ ] Verificar limites de utilização

#### 6.4 Verificação de Acesso
- [ ] Helper para verificar se organização tem licença activa
- [ ] Helper para verificar se feature está disponível
- [ ] Helper para verificar limites
- [ ] Integrar verificação no middleware

#### 6.5 Registo de Utilização
- [ ] API para registar utilização (chamada pelas apps)
- [ ] Agregação de métricas
- [ ] Alertas de proximidade de limites

#### 6.6 UI de Licenciamento
- [ ] Página de licenças da organização
- [ ] Vista de planos disponíveis
- [ ] Detalhes da licença (limites, utilização)
- [ ] Histórico de licenças

### Entregáveis
- Sistema de licenças funcional
- Planos e features configuráveis
- Verificação de acesso integrada
- Registo de utilização
- UI de gestão

### Schema Prisma (Licenciamento)

```prisma
model Plan {
  id          String   @id @default(cuid())
  appId       String
  name        String   // "Basic", "Professional", "Enterprise"
  slug        String
  description String?
  price       Decimal? @db.Decimal(10, 2)
  billingCycle String?  // "monthly", "yearly"
  isActive    Boolean  @default(true)
  features    Json     // { "maxUsers": 10, "maxVehicles": 50, ... }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  app      App       @relation(fields: [appId], references: [id])
  licenses License[]

  @@unique([appId, slug])
}

model License {
  id             String        @id @default(cuid())
  organizationId String
  appId          String
  planId         String
  status         LicenseStatus @default(ACTIVE)
  validFrom      DateTime      @default(now())
  validUntil     DateTime?
  trialEndsAt    DateTime?
  cancelledAt    DateTime?
  metadata       Json          @default("{}")
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
  app          App          @relation(fields: [appId], references: [id])
  plan         Plan         @relation(fields: [planId], references: [id])
  usage        UsageRecord[]

  @@unique([organizationId, appId])
}

model UsageRecord {
  id        String   @id @default(cuid())
  licenseId String
  metric    String   // "users_count", "vehicles_count", "storage_mb"
  value     Int
  recordedAt DateTime @default(now())

  license License @relation(fields: [licenseId], references: [id])

  @@index([licenseId, metric, recordedAt])
}

enum LicenseStatus {
  TRIAL
  ACTIVE
  SUSPENDED
  CANCELLED
  EXPIRED
}
```

---

## Fase 7 — OAuth Provider

**Objectivo:** Transformar o bee2hive num Identity Provider OAuth 2.0 / OpenID Connect para as apps do ecossistema.

### Tarefas

#### 7.1 Investigação e Setup
- [ ] Escolher biblioteca OAuth Provider (ex: oidc-provider, ou implementação customizada)
- [ ] Definir fluxos suportados (Authorization Code, Refresh Token)
- [ ] Configurar endpoints OAuth

#### 7.2 Schema OAuth Provider
- [ ] Criar modelo OAuthClient (apps registadas)
- [ ] Criar modelo OAuthAuthorizationCode
- [ ] Criar modelo OAuthAccessToken
- [ ] Criar modelo OAuthRefreshToken
- [ ] Executar migrations

#### 7.3 Endpoints OAuth
- [ ] GET /oauth/authorize (authorization endpoint)
- [ ] POST /oauth/token (token endpoint)
- [ ] GET /oauth/userinfo (userinfo endpoint)
- [ ] POST /oauth/revoke (revocation endpoint)
- [ ] GET /.well-known/openid-configuration (discovery)
- [ ] GET /.well-known/jwks.json (JWKS)

#### 7.4 Fluxo Authorization Code
- [ ] Validar client_id e redirect_uri
- [ ] Mostrar ecrã de consentimento (se necessário)
- [ ] Gerar authorization code
- [ ] Trocar code por tokens
- [ ] Incluir claims no ID token

#### 7.5 Gestão de Tokens
- [ ] Gerar access tokens (JWT)
- [ ] Gerar refresh tokens
- [ ] Validar tokens
- [ ] Revogar tokens
- [ ] Configurar expiração

#### 7.6 Claims e Scopes
- [ ] Definir scopes disponíveis
  - [ ] openid
  - [ ] profile
  - [ ] email
  - [ ] organization
  - [ ] permissions
- [ ] Mapear scopes para claims
- [ ] Incluir informação de tenant nos tokens

### Entregáveis
- bee2hive como OAuth 2.0 Provider
- Suporte a OpenID Connect
- Tokens JWT com claims de tenant/permissões
- Discovery endpoint funcional

### Schema Prisma (OAuth Provider)

```prisma
model OAuthClient {
  id           String   @id @default(cuid())
  appId        String   @unique
  clientId     String   @unique
  clientSecret String   // Encriptado
  redirectUris String[]
  scopes       String[] @default(["openid", "profile", "email"])
  grantTypes   String[] @default(["authorization_code", "refresh_token"])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  app                App                     @relation(fields: [appId], references: [id])
  authorizationCodes OAuthAuthorizationCode[]
  accessTokens       OAuthAccessToken[]
  refreshTokens      OAuthRefreshToken[]
}

model OAuthAuthorizationCode {
  id          String   @id @default(cuid())
  code        String   @unique
  clientId    String
  userId      String
  redirectUri String
  scope       String
  expiresAt   DateTime
  usedAt      DateTime?
  createdAt   DateTime @default(now())

  client OAuthClient @relation(fields: [clientId], references: [clientId])
  user   User        @relation(fields: [userId], references: [id])
}

model OAuthAccessToken {
  id        String   @id @default(cuid())
  token     String   @unique
  clientId  String
  userId    String
  scope     String
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())

  client OAuthClient @relation(fields: [clientId], references: [clientId])
  user   User        @relation(fields: [userId], references: [id])
}

model OAuthRefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  clientId  String
  userId    String
  scope     String
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())

  client OAuthClient @relation(fields: [clientId], references: [clientId])
  user   User        @relation(fields: [userId], references: [id])
}
```

### Estrutura do JWT Access Token

```json
{
  "iss": "https://hive.bee2.com",
  "sub": "user_abc123",
  "aud": ["bee2fleet"],
  "exp": 1699999999,
  "iat": 1699996399,
  "azp": "bee2fleet",
  "scope": "openid profile email organization permissions",
  
  "email": "joao@empresa.pt",
  "name": "João Silva",
  
  "org_id": "org_xyz789",
  "org_name": "Empresa Exemplo",
  "org_slug": "empresa-exemplo",
  
  "roles": ["fleet_admin"],
  "permissions": [
    "fleet:vehicles:read",
    "fleet:vehicles:write",
    "fleet:trips:read"
  ]
}
```

---

## Fase 8 — Registo de Apps

**Objectivo:** Permitir registar e gerir as aplicações do ecossistema no bee2hive.

### Tarefas

#### 8.1 Schema de Apps
- [ ] Criar modelo App (se não existir)
- [ ] Criar modelo AppPermission
- [ ] Criar relações com OAuth e Licenciamento
- [ ] Executar migrations

#### 8.2 CRUD de Apps
- [ ] API para criar app
- [ ] API para listar apps
- [ ] API para obter detalhes da app
- [ ] API para actualizar app
- [ ] API para desactivar app

#### 8.3 Gestão de Credenciais
- [ ] Gerar client_id e client_secret
- [ ] Regenerar client_secret
- [ ] Encriptar secrets na BD
- [ ] Validar redirect URIs

#### 8.4 Permissões por App
- [ ] CRUD de permissões da app
- [ ] Sincronizar permissões (API para a app registar as suas)
- [ ] Associar permissões a papéis

#### 8.5 UI de Gestão de Apps
- [ ] Página de listagem de apps do ecossistema
- [ ] Página de detalhes da app
- [ ] Formulário de registo de nova app
- [ ] Gestão de credenciais
- [ ] Gestão de permissões

### Entregáveis
- CRUD completo de apps
- Gestão de credenciais OAuth
- Sistema de permissões por app
- UI de administração

### Schema Prisma (Apps)

```prisma
model App {
  id          String    @id @default(cuid())
  name        String    // "Bee2Fleet"
  slug        String    @unique // "bee2fleet"
  description String?
  baseUrl     String    // "https://fleet.bee2.com"
  iconUrl     String?
  status      AppStatus @default(ACTIVE)
  isCore      Boolean   @default(false) // true para bee2hive
  metadata    Json      @default("{}")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  oauthClient OAuthClient?
  permissions Permission[]
  plans       Plan[]
  licenses    License[]
}

enum AppStatus {
  DRAFT
  ACTIVE
  SUSPENDED
  DEPRECATED
}
```

---

## Fase 9 — SDK (@bee2/hive-sdk)

**Objectivo:** Criar package npm que simplifica a integração das apps do ecossistema com o bee2hive.

### Tarefas

#### 9.1 Setup do Package
- [ ] Criar repositório para o SDK
- [ ] Configurar TypeScript
- [ ] Configurar build (tsup ou similar)
- [ ] Configurar testes (vitest)
- [ ] Configurar publicação npm

#### 9.2 Módulo de Autenticação
- [ ] Criar Bee2HiveProvider para NextAuth
- [ ] Implementar validação de tokens
- [ ] Implementar refresh de tokens
- [ ] Helpers para obter sessão

#### 9.3 Módulo de Middleware
- [ ] Middleware de autenticação para Next.js
- [ ] Middleware de verificação de licença
- [ ] Middleware de verificação de permissões
- [ ] Configuração de rotas públicas

#### 9.4 Módulo de Contexto
- [ ] getTenantContext() — obter contexto do tenant actual
- [ ] getCurrentUser() — obter utilizador actual
- [ ] getPermissions() — obter permissões
- [ ] checkPermission() — verificar permissão específica

#### 9.5 Módulo de API Client
- [ ] Cliente HTTP configurado
- [ ] Métodos para chamar APIs do bee2hive
- [ ] Retry automático
- [ ] Gestão de erros

#### 9.6 Componentes React (opcional)
- [ ] AppLauncher — menu de apps
- [ ] UserMenu — menu do utilizador
- [ ] PermissionGate — renderização condicional por permissão

#### 9.7 Documentação
- [ ] README com quick start
- [ ] Documentação de API
- [ ] Exemplos de uso
- [ ] Guia de migração (futuro)

### Entregáveis
- Package npm publicado
- Documentação completa
- Exemplos de integração

### Estrutura do SDK

```
@bee2/hive-sdk/
├── src/
│   ├── index.ts
│   ├── auth/
│   │   ├── provider.ts      # Bee2HiveProvider
│   │   ├── session.ts       # Helpers de sessão
│   │   └── tokens.ts        # Gestão de tokens
│   ├── middleware/
│   │   ├── auth.ts          # withBee2Auth
│   │   ├── permissions.ts   # requirePermission
│   │   └── license.ts       # requireLicense
│   ├── context/
│   │   ├── tenant.ts        # getTenantContext
│   │   └── user.ts          # getCurrentUser
│   ├── api/
│   │   ├── client.ts        # HTTP client
│   │   ├── organizations.ts
│   │   ├── users.ts
│   │   └── licenses.ts
│   ├── components/
│   │   ├── AppLauncher.tsx
│   │   ├── UserMenu.tsx
│   │   └── PermissionGate.tsx
│   └── types/
│       └── index.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

### Exemplo de Uso

```typescript
// next.config.js da app (ex: bee2fleet)
// Nada de especial necessário

// middleware.ts
import { withBee2Auth } from '@bee2/hive-sdk/middleware'

export default withBee2Auth({
  publicRoutes: ['/public', '/api/health'],
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { Bee2HiveProvider } from '@bee2/hive-sdk/auth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Bee2HiveProvider({
      clientId: process.env.BEE2HIVE_CLIENT_ID!,
      clientSecret: process.env.BEE2HIVE_CLIENT_SECRET!,
      issuer: process.env.BEE2HIVE_URL,
    }),
  ],
})

export const { GET, POST } = handlers

// app/api/vehicles/route.ts
import { getTenantContext, requirePermission } from '@bee2/hive-sdk'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const ctx = await getTenantContext(req)
  
  const vehicles = await prisma.vehicle.findMany({
    where: { tenantId: ctx.tenantId },
  })
  
  return Response.json(vehicles)
}

export async function POST(req: Request) {
  await requirePermission(req, 'fleet:vehicles:create')
  
  const ctx = await getTenantContext(req)
  const data = await req.json()
  
  const vehicle = await prisma.vehicle.create({
    data: {
      ...data,
      tenantId: ctx.tenantId,
    },
  })
  
  return Response.json(vehicle)
}

// app/vehicles/page.tsx
import { PermissionGate } from '@bee2/hive-sdk/components'

export default function VehiclesPage() {
  return (
    <div>
      <h1>Veículos</h1>
      
      <PermissionGate permission="fleet:vehicles:create">
        <Button>Adicionar Veículo</Button>
      </PermissionGate>
      
      <VehicleList />
    </div>
  )
}
```

---

## Fase 10 — APIs do Ecossistema

**Objectivo:** Implementar APIs que as apps do ecossistema consomem.

### Tarefas

#### 10.1 API de Introspecção
- [ ] POST /api/v1/auth/introspect — validar token
- [ ] Retornar informação do utilizador e permissões
- [ ] Cache de validações

#### 10.2 APIs de Organizações
- [ ] GET /api/v1/organizations/:id — detalhes da organização
- [ ] GET /api/v1/organizations/:id/users — utilizadores da organização
- [ ] GET /api/v1/organizations/:id/settings — configurações

#### 10.3 APIs de Licenciamento
- [ ] GET /api/v1/licenses/check — verificar licença activa
- [ ] GET /api/v1/licenses/:id/features — features disponíveis
- [ ] GET /api/v1/licenses/:id/limits — limites e utilização
- [ ] POST /api/v1/usage/report — reportar utilização

#### 10.4 APIs de Permissões
- [ ] GET /api/v1/permissions — listar permissões disponíveis
- [ ] POST /api/v1/permissions/check — verificar permissão
- [ ] POST /api/v1/apps/:id/permissions/sync — sincronizar permissões da app

#### 10.5 Autenticação das APIs
- [ ] Autenticação por app (client credentials)
- [ ] Autenticação por utilizador (bearer token)
- [ ] Rate limiting por app/organização

#### 10.6 Documentação
- [ ] Gerar especificação OpenAPI
- [ ] Documentação interactiva (Swagger UI ou similar)
- [ ] Exemplos de chamadas
- [ ] SDK auto-gerado (opcional)

### Entregáveis
- APIs documentadas e funcionais
- Autenticação M2M (machine-to-machine)
- Especificação OpenAPI
- Rate limiting implementado

### Endpoints Resumidos

```
# Autenticação
POST   /api/v1/auth/introspect          # Validar token

# Organizações
GET    /api/v1/organizations/:id        # Detalhes da organização
GET    /api/v1/organizations/:id/users  # Utilizadores
GET    /api/v1/organizations/:id/settings # Configurações

# Licenciamento
GET    /api/v1/licenses/check           # Verificar licença
GET    /api/v1/licenses/:id/features    # Features do plano
GET    /api/v1/licenses/:id/limits      # Limites e utilização actual
POST   /api/v1/usage/report             # Reportar métrica de utilização

# Permissões
GET    /api/v1/permissions              # Listar permissões
POST   /api/v1/permissions/check        # Verificar permissão específica

# Apps (admin)
GET    /api/v1/apps                     # Listar apps
GET    /api/v1/apps/:id                 # Detalhes da app
POST   /api/v1/apps/:id/permissions/sync # Sincronizar permissões
```

---

## Fase 11 — Dashboard Administrativo

**Objectivo:** Criar interface completa para administração do bee2hive.

### Tarefas

#### 11.1 Layout e Navegação
- [ ] Layout do dashboard com sidebar
- [ ] Navegação principal
- [ ] Breadcrumbs
- [ ] Header com user menu e notificações
- [ ] Tema claro/escuro

#### 11.2 Dashboard Principal
- [ ] Widgets de resumo (utilizadores, licenças, etc.)
- [ ] Actividade recente
- [ ] Alertas e notificações
- [ ] Quick actions

#### 11.3 Páginas de Gestão
- [ ] Organizações (listagem, detalhes, edição)
- [ ] Utilizadores (listagem, detalhes, edição)
- [ ] Papéis e Permissões
- [ ] Licenças (listagem, detalhes, histórico)
- [ ] Apps do Ecossistema
- [ ] Convites pendentes

#### 11.4 Configurações
- [ ] Configurações da organização
- [ ] Branding (logo, cores)
- [ ] Integrações
- [ ] Segurança (MFA, políticas de password)

#### 11.5 Perfil e Conta
- [ ] Perfil pessoal
- [ ] Segurança da conta
- [ ] Sessões activas
- [ ] Preferências

#### 11.6 Componentes Reutilizáveis
- [ ] DataTable genérica com sort/filter/pagination
- [ ] Formulários com validação (react-hook-form + zod)
- [ ] Modais de confirmação
- [ ] Toasts/notificações
- [ ] Empty states
- [ ] Loading states

### Entregáveis
- Dashboard completo e funcional
- Todas as páginas de gestão
- Componentes reutilizáveis
- Responsivo (desktop + tablet)

---

## Fase 12 — Auditoria e Logs

**Objectivo:** Implementar sistema de auditoria para rastrear todas as acções no sistema.

### Tarefas

#### 12.1 Schema de Auditoria
- [ ] Criar modelo AuditLog
- [ ] Definir tipos de eventos
- [ ] Índices para queries eficientes
- [ ] Executar migrations

#### 12.2 Captura de Eventos
- [ ] Middleware/decorator para capturar acções
- [ ] Eventos de autenticação (login, logout, falhas)
- [ ] Eventos de CRUD (criar, editar, eliminar)
- [ ] Eventos de permissões (atribuir, remover)
- [ ] Eventos de licenciamento

#### 12.3 APIs de Auditoria
- [ ] Listar logs (com filtros)
- [ ] Detalhes de um evento
- [ ] Exportar logs (CSV, JSON)
- [ ] Estatísticas de actividade

#### 12.4 UI de Auditoria
- [ ] Página de listagem de logs
- [ ] Filtros avançados (data, utilizador, acção, recurso)
- [ ] Timeline de actividade
- [ ] Detalhes do evento
- [ ] Exportação

#### 12.5 Retenção e Archiving
- [ ] Política de retenção configurável
- [ ] Archiving de logs antigos
- [ ] Limpeza automática

### Entregáveis
- Sistema de auditoria completo
- UI para consulta de logs
- Exportação de dados
- Políticas de retenção

### Schema Prisma (Auditoria)

```prisma
model AuditLog {
  id             String   @id @default(cuid())
  timestamp      DateTime @default(now())
  
  // Quem
  actorId        String?  // userId ou "system"
  actorType      String   // "user", "system", "app"
  actorEmail     String?
  
  // Onde
  organizationId String?
  appId          String?
  ipAddress      String?
  userAgent      String?
  
  // O quê
  action         String   // "user.created", "license.activated"
  resource       String   // "user", "license", "organization"
  resourceId     String?
  
  // Detalhes
  status         String   // "success", "failure"
  metadata       Json     @default("{}")
  changes        Json?    // { before: {...}, after: {...} }
  
  @@index([organizationId, timestamp])
  @@index([actorId, timestamp])
  @@index([action, timestamp])
  @@index([resource, resourceId])
}
```

---

## Dependências entre Fases

```
Fase 1 (Fundação)
    │
    ▼
Fase 2 (Autenticação)
    │
    ▼
Fase 3 (Multi-tenancy)
    │
    ├──────────────────┐
    ▼                  ▼
Fase 4 (Utilizadores)  Fase 5 (RBAC)
    │                  │
    └────────┬─────────┘
             │
             ▼
      Fase 6 (Licenciamento)
             │
             ▼
      Fase 7 (OAuth Provider)
             │
             ▼
      Fase 8 (Registo Apps)
             │
    ┌────────┴────────┐
    ▼                 ▼
Fase 9 (SDK)    Fase 10 (APIs)
    │                 │
    └────────┬────────┘
             │
             ▼
      Fase 11 (Dashboard)
             │
             ▼
      Fase 12 (Auditoria)
```

---

## Marcos (Milestones)

### Milestone 1: MVP Interno
**Fases:** 1-5
**Duração:** ~3-4 semanas

Bee2hive funcional para gestão interna de organizações, utilizadores e permissões. Ainda sem integração com apps externas.

### Milestone 2: Sistema de Licenciamento
**Fases:** 6
**Duração:** ~1 semana

Capacidade de gerir licenças e planos. Preparação para apps externas.

### Milestone 3: Ecossistema Ready
**Fases:** 7-10
**Duração:** ~3-4 semanas

Bee2hive pronto para integrar apps do ecossistema. SDK publicado.

### Milestone 4: Produção Ready
**Fases:** 11-12
**Duração:** ~2 semanas

Dashboard completo e sistema de auditoria. Pronto para produção.

---

## Considerações Técnicas

### Performance
- Utilizar Supabase connection pooling (Supavisor) para gestão de conexões
- Implementar caching (Redis ou Supabase Edge Functions cache) para tokens e permissões
- Índices adequados na BD
- Usar Supabase Realtime selectivamente (apenas onde necessário)

### Segurança
- HTTPS obrigatório
- Secrets encriptados na BD
- Rate limiting em todas as APIs
- Validação de input (zod)
- Sanitização de output
- Headers de segurança (helmet)
- RLS activo em todas as tabelas multi-tenant
- Usar service_role key apenas no backend (nunca expor ao cliente)

### Supabase-Específico
- Usar `DIRECT_URL` para migrations (bypassa connection pooling)
- Usar `DATABASE_URL` com pooling para a aplicação
- Configurar buckets no Supabase Storage com políticas de acesso
- Considerar Supabase Edge Functions para webhooks e processamento assíncrono

### Monitorização
- Logging estruturado
- Métricas de performance (Supabase Dashboard + custom)
- Alertas de erros
- Health checks

### Testes
- Testes unitários (vitest)
- Testes de integração
- Testes E2E (playwright)
- Testes de APIs

---

## Próximos Passos

1. **Aprovar plano** — Validar fases e prioridades
2. **Setup inicial** — Criar repositório e estrutura base
3. **Iniciar Fase 1** — Fundação do projecto

---

*Documento gerado em: Novembro 2024*
*Versão: 1.0*