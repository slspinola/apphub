# Especificação: Sistema de Scope (Âmbito de Acesso)

## 1. Visão Geral

### 1.1 Objectivo

O sistema de Scope complementa o RBAC permitindo restringir o acesso a **subconjuntos de dados** dentro de uma organização. Enquanto o RBAC define **o que** um utilizador pode fazer (acções), o Scope define **sobre que dados** essas acções se aplicam.

### 1.2 Problema a Resolver

```
Organização: "Transportes ABC"
│
├── Utilizadores Internos
│   └── Vêem TODOS os dados da organização
│
└── Clientes Externos (acedem ao sistema para ver os seus serviços)
    ├── Cliente "Loja Xpto" → Só vê serviços da Loja Xpto
    └── Cliente "Fábrica YZ" → Só vê serviços da Fábrica YZ
```

Sem Scope, teríamos de criar uma organização separada para cada cliente externo, o que não é prático.

### 1.3 Solução

Adicionar um campo `scope` à relação utilizador-organização (Membership) que define filtros de dados. Este scope é incluído no token JWT e as aplicações do ecossistema aplicam os filtros correspondentes.

---

## 2. Arquitectura

### 2.1 Fluxo de Dados

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  apphub   │────►│  Token JWT  │────►│  bee2fleet  │
│             │     │             │     │  (ou outra) │
│ Define:     │     │ Contém:     │     │             │
│ • Papéis    │     │ • user_id   │     │ Aplica:     │
│ • Permissões│     │ • org_id    │     │ • Filtros   │
│ • Scope     │     │ • roles     │     │   de dados  │
│             │     │ • perms     │     │   baseados  │
│             │     │ • scope ◄───┼─────│   no scope  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 2.2 Responsabilidades

| Componente | Responsabilidade |
|------------|------------------|
| **apphub** | Definir e armazenar scopes, incluir no JWT, fornecer UI de gestão |
| **SDK** | Extrair scope do token, fornecer helpers para aplicar filtros |
| **Apps** | Aplicar filtros de dados baseados no scope recebido |

---

## 3. Modelo de Dados

### 3.1 Schema Prisma (apphub)

```prisma
// Tipos de scope suportados por cada aplicação
model AppScopeType {
  id          String   @id @default(cuid())
  appId       String
  slug        String   // "customer", "region", "vehicle_group"
  name        String   // "Cliente", "Região", "Grupo de Viaturas"
  description String?
  
  // Configuração do scope
  config      Json     // Estrutura esperada, validações, etc.
  
  // Se requer selecção de valores (ex: escolher cliente)
  requiresSelection Boolean @default(true)
  
  // Endpoint na app para obter opções (ex: lista de clientes)
  optionsEndpoint   String?  // "/api/v1/scope-options/customers"
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  app         App      @relation(fields: [appId], references: [id])

  @@unique([appId, slug])
}

// Scope atribuído a um membership
model MembershipScope {
  id           String   @id @default(cuid())
  membershipId String
  appId        String   // Scope específico por app
  
  // Tipo e valor do scope
  scopeType    String   // "full_access", "customer", "region", etc.
  scopeValue   Json?    // { "customer_id": "cust_123" } ou null para full_access
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  membership   Membership @relation(fields: [membershipId], references: [id], onDelete: Cascade)
  app          App        @relation(fields: [appId], references: [id])

  @@unique([membershipId, appId]) // Um scope por app por membership
}

// Actualização do Membership existente
model Membership {
  id             String   @id @default(cuid())
  userId         String
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user         User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  roles        MembershipRole[]
  scopes       MembershipScope[] // NOVO: Scopes por aplicação

  @@unique([userId, organizationId])
}
```

### 3.2 Estrutura do Scope no JWT

```json
{
  "sub": "user_abc123",
  "org_id": "org_xyz789",
  "roles": ["external_customer"],
  "permissions": ["services:read", "services:track"],
  
  "scopes": {
    "bee2fleet": {
      "type": "customer",
      "value": {
        "customer_id": "cust_loja_xpto",
        "customer_name": "Loja Xpto"
      }
    },
    "bee2vision": {
      "type": "camera_group",
      "value": {
        "group_ids": ["grp_1", "grp_2"]
      }
    }
  }
}
```

### 3.3 Tipos de Scope Predefinidos

| Tipo | Descrição | Estrutura do Value |
|------|-----------|-------------------|
| `full_access` | Acesso a todos os dados | `null` |
| `customer` | Limitado a um cliente | `{ "customer_id": "..." }` |
| `customers` | Limitado a vários clientes | `{ "customer_ids": ["...", "..."] }` |
| `region` | Limitado a uma região | `{ "region": "norte" }` |
| `entity_ids` | Limitado a IDs específicos | `{ "ids": ["...", "..."] }` |
| `custom` | Filtro customizado | `{ ... }` (definido pela app) |

---

## 4. APIs do apphub

### 4.1 Gestão de Tipos de Scope (Admin)

```
# Registar tipo de scope para uma app
POST /api/v1/apps/{appId}/scope-types
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "slug": "customer",
  "name": "Cliente",
  "description": "Limita acesso aos dados de um cliente específico",
  "requiresSelection": true,
  "optionsEndpoint": "/api/v1/scope-options/customers",
  "config": {
    "valueSchema": {
      "type": "object",
      "properties": {
        "customer_id": { "type": "string" }
      },
      "required": ["customer_id"]
    }
  }
}

Response: 201 Created
{
  "id": "scope_type_abc",
  "appId": "app_fleet",
  "slug": "customer",
  "name": "Cliente",
  ...
}
```

```
# Listar tipos de scope de uma app
GET /api/v1/apps/{appId}/scope-types
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "data": [
    {
      "slug": "full_access",
      "name": "Acesso Total",
      "requiresSelection": false
    },
    {
      "slug": "customer",
      "name": "Cliente",
      "requiresSelection": true,
      "optionsEndpoint": "/api/v1/scope-options/customers"
    },
    {
      "slug": "region",
      "name": "Região",
      "requiresSelection": true,
      "optionsEndpoint": "/api/v1/scope-options/regions"
    }
  ]
}
```

### 4.2 Gestão de Scope de Utilizadores

```
# Definir scope de um utilizador para uma app
PUT /api/v1/memberships/{membershipId}/scopes/{appId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "scopeType": "customer",
  "scopeValue": {
    "customer_id": "cust_loja_xpto",
    "customer_name": "Loja Xpto"
  }
}

Response: 200 OK
{
  "id": "scope_xyz",
  "membershipId": "memb_123",
  "appId": "app_fleet",
  "scopeType": "customer",
  "scopeValue": {
    "customer_id": "cust_loja_xpto",
    "customer_name": "Loja Xpto"
  }
}
```

```
# Obter scopes de um utilizador
GET /api/v1/memberships/{membershipId}/scopes
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "data": [
    {
      "appId": "app_fleet",
      "appName": "Bee2Fleet",
      "scopeType": "customer",
      "scopeValue": {
        "customer_id": "cust_loja_xpto",
        "customer_name": "Loja Xpto"
      }
    },
    {
      "appId": "app_vision",
      "appName": "Bee2Vision",
      "scopeType": "full_access",
      "scopeValue": null
    }
  ]
}
```

```
# Remover scope (volta a full_access)
DELETE /api/v1/memberships/{membershipId}/scopes/{appId}
Authorization: Bearer {admin_token}

Response: 204 No Content
```

### 4.3 Obter Opções de Scope (Proxy para Apps)

Quando o admin está a configurar o scope de um utilizador, precisa de ver as opções disponíveis (ex: lista de clientes). O apphub faz proxy para a app.

```
# Obter opções disponíveis para um tipo de scope
GET /api/v1/apps/{appId}/scope-options/{scopeType}
Authorization: Bearer {admin_token}
X-Tenant-ID: {org_id}

Response: 200 OK
{
  "data": [
    { "id": "cust_loja_xpto", "name": "Loja Xpto" },
    { "id": "cust_fabrica_yz", "name": "Fábrica YZ" },
    { "id": "cust_empresa_abc", "name": "Empresa ABC" }
  ]
}
```

O apphub chama internamente:
```
GET {app.baseUrl}/api/v1/scope-options/customers
Authorization: Bearer {service_token}
X-Tenant-ID: {org_id}
```

---

## 5. Integração no Token JWT

### 5.1 Callback de Geração do Token

Quando o utilizador faz login e o token é gerado, o apphub inclui os scopes:

```typescript
// auth/callbacks.ts (apphub)

async function generateToken(user: User, organization: Organization) {
  // Buscar membership com scopes
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id
      }
    },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      },
      scopes: {
        include: {
          app: true
        }
      }
    }
  })

  // Construir objecto de scopes
  const scopes: Record<string, ScopeValue> = {}
  
  for (const scope of membership.scopes) {
    scopes[scope.app.slug] = {
      type: scope.scopeType,
      value: scope.scopeValue
    }
  }

  // Construir token
  const token = {
    sub: user.id,
    email: user.email,
    name: user.name,
    org_id: organization.id,
    org_name: organization.name,
    org_slug: organization.slug,
    roles: membership.roles.map(r => r.role.slug),
    permissions: extractPermissions(membership.roles),
    scopes: scopes, // NOVO
    licensed_apps: await getLicensedApps(organization.id)
  }

  return signJwt(token)
}
```

### 5.2 Estrutura Completa do Token

```json
{
  "iss": "https://hub.bee2.com",
  "sub": "user_pedro_123",
  "aud": ["bee2fleet", "bee2vision"],
  "exp": 1699999999,
  "iat": 1699996399,
  
  "email": "pedro@lojaxpto.pt",
  "name": "Pedro Costa",
  
  "org_id": "org_transportes_abc",
  "org_name": "Transportes ABC",
  "org_slug": "transportes-abc",
  
  "roles": ["external_customer"],
  
  "permissions": [
    "fleet:services:read",
    "fleet:services:track",
    "fleet:vehicles:read"
  ],
  
  "scopes": {
    "bee2fleet": {
      "type": "customer",
      "value": {
        "customer_id": "cust_loja_xpto",
        "customer_name": "Loja Xpto"
      }
    },
    "bee2vision": {
      "type": "full_access",
      "value": null
    }
  },
  
  "licensed_apps": ["bee2fleet", "bee2vision"]
}
```

---

## 6. SDK (@apphub/sdk)

### 6.1 Extracção do Scope

```typescript
// @apphub/sdk/src/context/scope.ts

export interface ScopeValue {
  type: string
  value: Record<string, any> | null
}

export interface TenantContext {
  userId: string
  tenantId: string
  roles: string[]
  permissions: string[]
  scope: ScopeValue | null
}

export async function getTenantContext(
  req: Request,
  appSlug: string
): Promise<TenantContext> {
  const token = await validateToken(req)
  
  // Extrair scope específico desta app
  const scope = token.scopes?.[appSlug] || { type: 'full_access', value: null }
  
  return {
    userId: token.sub,
    tenantId: token.org_id,
    roles: token.roles,
    permissions: token.permissions,
    scope: scope
  }
}
```

### 6.2 Helper para Aplicar Filtros

```typescript
// @apphub/sdk/src/context/scope-filters.ts

import { Prisma } from '@prisma/client'

export type ScopeFilterConfig = {
  // Mapeamento de tipo de scope para campo na BD
  customer: string      // ex: "customerId"
  customers: string     // ex: "customerId"
  region: string        // ex: "region"
  entity_ids: string    // ex: "id"
}

export function applyScopeFilter<T extends Record<string, any>>(
  where: T,
  scope: ScopeValue,
  config: Partial<ScopeFilterConfig>
): T {
  if (!scope || scope.type === 'full_access') {
    return where
  }

  const result = { ...where }

  switch (scope.type) {
    case 'customer':
      if (config.customer && scope.value?.customer_id) {
        result[config.customer] = scope.value.customer_id
      }
      break

    case 'customers':
      if (config.customers && scope.value?.customer_ids) {
        result[config.customers] = { in: scope.value.customer_ids }
      }
      break

    case 'region':
      if (config.region && scope.value?.region) {
        result[config.region] = scope.value.region
      }
      break

    case 'entity_ids':
      if (config.entity_ids && scope.value?.ids) {
        result[config.entity_ids] = { in: scope.value.ids }
      }
      break

    default:
      // Scope customizado: aplicar todos os campos do value
      if (scope.value) {
        Object.assign(result, scope.value)
      }
  }

  return result
}
```

### 6.3 Uso nas Apps

```typescript
// bee2fleet/app/api/services/route.ts

import { getTenantContext, applyScopeFilter } from '@apphub/sdk'
import { prisma } from '@/lib/prisma'

const SCOPE_CONFIG = {
  customer: 'customerId',
  region: 'region'
}

export async function GET(req: Request) {
  const ctx = await getTenantContext(req, 'bee2fleet')
  
  // Verificar permissão
  if (!ctx.permissions.includes('fleet:services:read')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Base query: sempre filtra por tenant
  let where: any = {
    orgId: ctx.tenantId
  }
  
  // Aplicar filtro de scope
  where = applyScopeFilter(where, ctx.scope, SCOPE_CONFIG)
  
  // Executar query
  const services = await prisma.service.findMany({
    where,
    include: {
      vehicle: true,
      customer: true
    }
  })
  
  return Response.json({ data: services })
}
```

### 6.4 Componente React para UI Condicional

```tsx
// @apphub/sdk/src/components/ScopeGate.tsx

'use client'

import { useSession } from 'next-auth/react'

interface ScopeGateProps {
  appSlug: string
  allowedTypes?: string[]  // Tipos de scope que permitem ver
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ScopeGate({ 
  appSlug, 
  allowedTypes = ['full_access'], 
  children,
  fallback = null 
}: ScopeGateProps) {
  const { data: session } = useSession()
  
  const scope = session?.user?.scopes?.[appSlug]
  const scopeType = scope?.type || 'full_access'
  
  if (allowedTypes.includes(scopeType)) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}

// Uso:
// <ScopeGate appSlug="bee2fleet" allowedTypes={['full_access']}>
//   <AdminPanel />  {/* Só aparece para quem tem full_access */}
// </ScopeGate>
```

---

## 7. Interface de Gestão (apphub)

### 7.1 Página de Edição de Utilizador

```
┌─────────────────────────────────────────────────────────────────┐
│  apphub > Utilizadores > Pedro Costa                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── Tabs ───────────────────────────────────────────────────┐ │
│  │ Perfil │ Papéis │ Âmbito de Acesso │ Actividade │          │ │
│  └────────────────────┬───────────────────────────────────────┘ │
│                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  ÂMBITO DE ACESSO                           ││
│  │                                                             ││
│  │  Define que dados este utilizador pode ver em cada          ││
│  │  aplicação. Isto não afecta as permissões (o que pode       ││
│  │  fazer), apenas os dados visíveis.                          ││
│  │                                                             ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ 🚗 Bee2Fleet                              [Editar]  │   ││
│  │  ├─────────────────────────────────────────────────────┤   ││
│  │  │ Âmbito: Cliente específico                          │   ││
│  │  │ Cliente: Loja Xpto                                  │   ││
│  │  │                                                     │   ││
│  │  │ ℹ️ Só verá serviços e viaturas associadas a este    │   ││
│  │  │   cliente.                                          │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  │                                                             ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ 🎥 Bee2Vision                             [Editar]  │   ││
│  │  ├─────────────────────────────────────────────────────┤   ││
│  │  │ Âmbito: Acesso total                                │   ││
│  │  │                                                     │   ││
│  │  │ ℹ️ Verá todas as câmaras e gravações da             │   ││
│  │  │   organização.                                      │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  │                                                             ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ ⚡ Bee2Energy                                  🔒   │   ││
│  │  ├─────────────────────────────────────────────────────┤   ││
│  │  │ Organização não tem licença para esta aplicação.    │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Modal de Edição de Âmbito

```
┌─────────────────────────────────────────────────────────────────┐
│  Configurar Âmbito — Bee2Fleet                              ✕   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tipo de Acesso                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ Acesso Total                                          │   │
│  │   Utilizador vê todos os dados da organização           │   │
│  │                                                         │   │
│  │ ● Cliente Específico                                    │   │
│  │   Utilizador só vê dados de um cliente                  │   │
│  │                                                         │   │
│  │ ○ Múltiplos Clientes                                    │   │
│  │   Utilizador vê dados de clientes seleccionados         │   │
│  │                                                         │   │
│  │ ○ Região                                                │   │
│  │   Utilizador só vê dados de uma região geográfica       │   │
│  │                                                         │   │
│  │ ○ Grupo de Viaturas                                     │   │
│  │   Utilizador só vê viaturas específicas                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Seleccionar Cliente                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍 Pesquisar...                                         │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ● Loja Xpto                                             │   │
│  │ ○ Fábrica YZ                                            │   │
│  │ ○ Empresa ABC                                           │   │
│  │ ○ Supermercado 123                                      │   │
│  │ ○ Armazém Central                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Atenção: Ao alterar o âmbito, o utilizador poderá   │   │
│  │ perder acesso a dados que tinha anteriormente.          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              [ Cancelar ]  [ Guardar ]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Requisitos das Apps do Ecossistema

Para que o sistema de scope funcione, cada app deve implementar:

### 8.1 Endpoint de Opções de Scope

```typescript
// bee2fleet/app/api/v1/scope-options/[type]/route.ts

import { validateServiceToken } from '@apphub/sdk'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { type: string } }
) {
  // Validar que é uma chamada do apphub
  await validateServiceToken(req)
  
  const tenantId = req.headers.get('X-Tenant-ID')
  const { type } = params

  switch (type) {
    case 'customers':
      const customers = await prisma.customer.findMany({
        where: { orgId: tenantId },
        select: { id: true, name: true }
      })
      return Response.json({ data: customers })

    case 'regions':
      const regions = await prisma.service.findMany({
        where: { orgId: tenantId },
        select: { region: true },
        distinct: ['region']
      })
      return Response.json({ 
        data: regions.map(r => ({ id: r.region, name: r.region }))
      })

    case 'vehicle_groups':
      const groups = await prisma.vehicleGroup.findMany({
        where: { orgId: tenantId },
        select: { id: true, name: true }
      })
      return Response.json({ data: groups })

    default:
      return Response.json({ error: 'Unknown scope type' }, { status: 400 })
  }
}
```

### 8.2 Aplicar Filtros em Todas as Queries

```typescript
// bee2fleet/lib/queries.ts

import { TenantContext, applyScopeFilter } from '@apphub/sdk'
import { prisma } from '@/lib/prisma'

const SCOPE_CONFIG = {
  customer: 'customerId',
  customers: 'customerId',
  region: 'region',
  entity_ids: 'vehicleId'
}

export async function getServices(ctx: TenantContext, filters?: any) {
  let where: any = {
    orgId: ctx.tenantId,
    ...filters
  }
  
  // OBRIGATÓRIO: Aplicar scope
  where = applyScopeFilter(where, ctx.scope, SCOPE_CONFIG)
  
  return prisma.service.findMany({ where })
}

export async function getVehicles(ctx: TenantContext, filters?: any) {
  let where: any = {
    orgId: ctx.tenantId,
    ...filters
  }
  
  // Para viaturas, o scope de customer aplica-se via serviços
  if (ctx.scope?.type === 'customer') {
    where.services = {
      some: {
        customerId: ctx.scope.value.customer_id
      }
    }
  }
  
  return prisma.vehicle.findMany({ where })
}
```

### 8.3 Registar Tipos de Scope no apphub

Quando a app é registada, deve informar os tipos de scope que suporta:

```typescript
// bee2fleet/scripts/register-scopes.ts

import { AppHubAdmin } from '@apphub/sdk/admin'

const admin = new AppHubAdmin({
  serviceKey: process.env.APPHUB_SERVICE_KEY
})

await admin.apps.registerScopeTypes('bee2fleet', [
  {
    slug: 'full_access',
    name: 'Acesso Total',
    description: 'Acesso a todos os dados da organização',
    requiresSelection: false
  },
  {
    slug: 'customer',
    name: 'Cliente',
    description: 'Acesso limitado a um cliente específico',
    requiresSelection: true,
    optionsEndpoint: '/api/v1/scope-options/customers'
  },
  {
    slug: 'customers',
    name: 'Múltiplos Clientes',
    description: 'Acesso limitado a clientes seleccionados',
    requiresSelection: true,
    optionsEndpoint: '/api/v1/scope-options/customers',
    config: { multiSelect: true }
  },
  {
    slug: 'region',
    name: 'Região',
    description: 'Acesso limitado a uma região geográfica',
    requiresSelection: true,
    optionsEndpoint: '/api/v1/scope-options/regions'
  }
])
```

---

## 9. Regras de Negócio

### 9.1 Scope por Defeito

- Quando um utilizador é adicionado a uma organização, o scope por defeito é `full_access` para todas as apps
- Apenas admins podem alterar scopes

### 9.2 Hierarquia de Restrições

```
Tenant (organização) → Scope → Permissões RBAC
         │               │            │
         │               │            └── O que pode fazer
         │               └── Que dados pode ver
         └── A que organização pertence
```

Um utilizador precisa de passar TODAS as verificações:
1. Pertencer à organização ✓
2. Ter scope que inclua o recurso ✓
3. Ter permissão para a acção ✓

### 9.3 Scope e Licenças

- O scope só é relevante para apps licenciadas
- Se a organização não tem licença para uma app, o scope não se aplica

### 9.4 Herança

- Scopes NÃO são herdados de papéis
- Cada utilizador tem os seus scopes individuais
- Admins podem ter templates de scope para aplicar rapidamente

---

## 10. Segurança

### 10.1 Validações

| Validação | Responsável |
|-----------|-------------|
| Token JWT válido e não expirado | SDK |
| Utilizador pertence ao tenant | SDK + App |
| Scope no token corresponde ao registado | apphub |
| Filtros de scope aplicados | App |

### 10.2 Prevenção de Bypass

```typescript
// ERRADO: Permite bypass do scope
app.get('/api/services/:id', async (req) => {
  const service = await prisma.service.findUnique({
    where: { id: req.params.id }
  })
  return service
})

// CORRECTO: Sempre verifica scope
app.get('/api/services/:id', async (req) => {
  const ctx = await getTenantContext(req, 'bee2fleet')
  
  let where: any = {
    id: req.params.id,
    orgId: ctx.tenantId
  }
  where = applyScopeFilter(where, ctx.scope, SCOPE_CONFIG)
  
  const service = await prisma.service.findFirst({ where })
  
  if (!service) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  
  return Response.json(service)
})
```

### 10.3 Auditoria

Todas as alterações de scope devem ser registadas:

```json
{
  "action": "membership.scope.updated",
  "actor": "user_admin_123",
  "target": "user_pedro_456",
  "changes": {
    "app": "bee2fleet",
    "before": { "type": "full_access" },
    "after": { "type": "customer", "value": { "customer_id": "cust_123" } }
  }
}
```

---

## 11. Migração e Compatibilidade

### 11.1 Utilizadores Existentes

- Utilizadores sem scope definido são tratados como `full_access`
- Migração não requer acção imediata

### 11.2 Apps sem Suporte a Scope

- Apps que não implementam scope continuam a funcionar
- O campo `scopes` no token é ignorado
- Quando a app implementar, basta registar os tipos

---

## 12. Checklist de Implementação

### apphub

- [ ] Modelo `AppScopeType` no Prisma
- [ ] Modelo `MembershipScope` no Prisma
- [ ] API para registar tipos de scope
- [ ] API para gerir scopes de utilizadores
- [ ] API proxy para opções de scope
- [ ] Inclusão de scopes no JWT
- [ ] UI de gestão de âmbito de acesso
- [ ] Auditoria de alterações de scope

### SDK (@apphub/sdk)

- [ ] Tipo `ScopeValue` e `TenantContext`
- [ ] Função `getTenantContext` actualizada
- [ ] Helper `applyScopeFilter`
- [ ] Componente `ScopeGate`
- [ ] Documentação

### Apps do Ecossistema

- [ ] Endpoint `/api/v1/scope-options/{type}`
- [ ] Aplicar `applyScopeFilter` em todas as queries
- [ ] Registar tipos de scope no apphub
- [ ] Testar isolamento de dados

---

## 13. Exemplos de Uso

### 13.1 Cliente Externo com Acesso Limitado

```
Utilizador: Pedro (cliente da Loja Xpto)
Organização: Transportes ABC
Papel: Cliente Externo
Permissões: services:read, services:track
Scope (bee2fleet): { type: "customer", value: { customer_id: "cust_loja_xpto" } }

Resultado: Pedro só vê serviços onde customerId = "cust_loja_xpto"
```

### 13.2 Gestor Regional

```
Utilizador: Maria (gestora da zona Norte)
Organização: Transportes ABC
Papel: Gestor Regional
Permissões: services:*, vehicles:read, reports:read
Scope (bee2fleet): { type: "region", value: { region: "norte" } }

Resultado: Maria pode fazer tudo, mas só vê dados da região Norte
```

### 13.3 Admin com Acesso Total

```
Utilizador: João (administrador)
Organização: Transportes ABC
Papel: Admin
Permissões: * (todas)
Scope (bee2fleet): { type: "full_access", value: null }

Resultado: João vê todos os dados sem restrições
```

---

*Versão: 1.0*
*Data: Novembro 2024*
