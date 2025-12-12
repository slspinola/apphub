# Especificação: AppHub

## 1. Visão Geral

### 1.1 Objectivo

O **AppHub** é o módulo do apphub responsável pelo registo, configuração e gestão de todas as aplicações do ecossistema. Funciona como um catálogo centralizado que define quais aplicações existem, como se autenticam, que permissões disponibilizam e como se integram com o hub.

### 1.2 Responsabilidades

```
┌─────────────────────────────────────────────────────────────────┐
│                           AppHub                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 CATÁLOGO DE APPS                                            │
│     • Registar novas aplicações                                 │
│     • Metadados (nome, descrição, ícone, URLs)                  │
│     • Estado (activa, suspensa, deprecated)                     │
│                                                                 │
│  🔐 CREDENCIAIS OAUTH                                           │
│     • Gerar client_id e client_secret                           │
│     • Gerir redirect URIs                                       │
│     • Regenerar secrets                                         │
│                                                                 │
│  🎫 PERMISSÕES                                                  │
│     • Registar permissões de cada app                           │
│     • Sincronizar permissões via API                            │
│     • Agrupar permissões por recurso                            │
│                                                                 │
│  🔍 TIPOS DE SCOPE                                              │
│     • Registar tipos de scope por app                           │
│     • Configurar endpoints de opções                            │
│                                                                 │
│  📊 PLANOS E LICENCIAMENTO                                      │
│     • Definir planos disponíveis                                │
│     • Configurar limites e features                             │
│     • Associar a sistema de licenças                            │
│                                                                 │
│  🔗 INTEGRAÇÕES                                                 │
│     • Webhooks de eventos                                       │
│     • Health checks                                             │
│     • Endpoints de configuração                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Fluxo de Integração de uma Nova App

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   1. Criar   │────►│  2. Config.  │────►│ 3. Registar  │────►│  4. Definir  │
│     App      │     │   OAuth      │     │  Permissões  │     │    Planos    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                      │
┌──────────────┐     ┌──────────────┐     ┌──────────────┐           │
│   7. App     │◄────│  6. Testar   │◄────│  5. Config.  │◄──────────┘
│   Activa     │     │  Integração  │     │    Scopes    │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 2. Modelo de Dados

### 2.1 Schema Prisma

```prisma
// ============================================================================
// APP - Aplicação do Ecossistema
// ============================================================================

model App {
  id          String    @id @default(cuid())
  
  // Identificação
  slug        String    @unique   // "bee2fleet", "bee2vision"
  name        String              // "Bee2Fleet"
  description String?             // "Gestão de frotas e logística"
  
  // Visual
  icon        String?             // URL do ícone
  color       String?             // Cor primária (#hex)
  
  // URLs
  baseUrl     String              // "https://fleet.bee2.com"
  loginUrl    String?             // URL específico de login (se diferente)
  docsUrl     String?             // URL da documentação
  supportUrl  String?             // URL de suporte
  
  // Estado
  status      AppStatus @default(DRAFT)
  isCore      Boolean   @default(false)  // true apenas para apphub
  isPublic    Boolean   @default(true)   // Visível no launcher
  
  // Configurações
  settings    Json      @default("{}")
  metadata    Json      @default("{}")
  
  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  publishedAt DateTime?             // Quando foi publicada
  
  // Relações
  oauthClient   OAuthClient?
  permissions   Permission[]
  scopeTypes    AppScopeType[]
  plans         Plan[]
  licenses      License[]
  webhooks      AppWebhook[]
  
  @@index([status])
}

enum AppStatus {
  DRAFT       // Em desenvolvimento, não visível
  BETA        // Em teste, visível apenas para alguns
  ACTIVE      // Activa e disponível
  SUSPENDED   // Temporariamente suspensa
  DEPRECATED  // Marcada para descontinuação
  ARCHIVED    // Arquivada, não funcional
}

// ============================================================================
// OAUTH CLIENT - Credenciais de Autenticação
// ============================================================================

model OAuthClient {
  id            String   @id @default(cuid())
  appId         String   @unique
  
  // Credenciais
  clientId      String   @unique           // Identificador público
  clientSecret  String                     // Hash do secret
  
  // Configuração OAuth
  redirectUris  String[]                   // URIs de callback permitidos
  scopes        String[] @default(["openid", "profile", "email", "organization"])
  grantTypes    String[] @default(["authorization_code", "refresh_token"])
  
  // Segurança
  tokenLifetime       Int @default(3600)    // Access token (segundos)
  refreshTokenLifetime Int @default(604800) // Refresh token (7 dias)
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  secretRotatedAt DateTime?
  
  // Relações
  app                App                     @relation(fields: [appId], references: [id], onDelete: Cascade)
  authorizationCodes OAuthAuthorizationCode[]
  accessTokens       OAuthAccessToken[]
  refreshTokens      OAuthRefreshToken[]
}

// ============================================================================
// PERMISSIONS - Permissões da Aplicação
// ============================================================================

model Permission {
  id          String   @id @default(cuid())
  appId       String
  
  // Identificação
  slug        String              // "vehicles:read", "vehicles:write"
  name        String              // "Ver Veículos"
  description String?             // "Permite visualizar lista de veículos"
  
  // Categorização
  resource    String              // "vehicles", "drivers", "trips"
  action      String              // "read", "write", "delete", "manage"
  
  // Ordenação e agrupamento
  group       String?             // Grupo para UI (ex: "Veículos", "Motoristas")
  sortOrder   Int     @default(0) // Ordem de exibição
  
  // Flags
  isSystem    Boolean @default(false)  // Permissão de sistema (não editável)
  isDefault   Boolean @default(false)  // Incluída por defeito em novos papéis
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relações
  app   App              @relation(fields: [appId], references: [id], onDelete: Cascade)
  roles RolePermission[]

  @@unique([appId, slug])
  @@index([appId, resource])
}

// ============================================================================
// SCOPE TYPES - Tipos de Âmbito de Acesso
// ============================================================================

model AppScopeType {
  id          String   @id @default(cuid())
  appId       String
  
  // Identificação
  slug        String              // "customer", "region", "vehicle_group"
  name        String              // "Cliente", "Região"
  description String?             // "Limita acesso a um cliente específico"
  
  // Configuração
  requiresSelection Boolean @default(true)   // Precisa escolher valor?
  multiSelect       Boolean @default(false)  // Permite múltiplos valores?
  optionsEndpoint   String?                  // "/api/v1/scope-options/customers"
  
  // Schema de validação do valor
  valueSchema Json?               // JSON Schema para validar scopeValue
  
  // Ordenação
  sortOrder   Int     @default(0)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relações
  app App @relation(fields: [appId], references: [id], onDelete: Cascade)

  @@unique([appId, slug])
}

// ============================================================================
// PLANS - Planos de Licenciamento
// ============================================================================

model Plan {
  id          String   @id @default(cuid())
  appId       String
  
  // Identificação
  slug        String              // "basic", "professional", "enterprise"
  name        String              // "Básico", "Profissional"
  description String?
  
  // Preços (opcional, para display)
  price       Decimal? @db.Decimal(10, 2)
  currency    String?  @default("EUR")
  billingCycle String? // "monthly", "yearly", "one-time"
  
  // Limites e Features
  limits      Json     @default("{}")  // { "maxUsers": 10, "maxVehicles": 50 }
  features    Json     @default("{}")  // { "reports": true, "api": false }
  
  // Estado
  isActive    Boolean  @default(true)
  isPublic    Boolean  @default(true)   // Visível para clientes
  isTrial     Boolean  @default(false)  // Plano de trial
  trialDays   Int?                      // Duração do trial
  
  // Ordenação
  sortOrder   Int      @default(0)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relações
  app      App       @relation(fields: [appId], references: [id], onDelete: Cascade)
  licenses License[]

  @@unique([appId, slug])
}

// ============================================================================
// WEBHOOKS - Notificações para Apps
// ============================================================================

model AppWebhook {
  id          String   @id @default(cuid())
  appId       String
  
  // Configuração
  url         String              // URL de destino
  events      String[]            // ["user.created", "license.activated"]
  
  // Segurança
  secret      String              // Para assinar payloads
  
  // Estado
  isActive    Boolean  @default(true)
  
  // Estatísticas
  lastTriggeredAt DateTime?
  lastStatus      Int?            // Último HTTP status
  failureCount    Int     @default(0)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relações
  app App @relation(fields: [appId], references: [id], onDelete: Cascade)

  @@index([appId, isActive])
}

// ============================================================================
// APP SETTINGS PER TENANT - Configurações por Organização
// ============================================================================

model AppTenantSettings {
  id             String   @id @default(cuid())
  appId          String
  organizationId String
  
  // Configurações específicas do tenant para esta app
  settings       Json     @default("{}")
  
  // Feature flags override (se permitido pelo plano)
  featureOverrides Json?
  
  // Timestamps
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relações
  app          App          @relation(fields: [appId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([appId, organizationId])
}
```

---

## 3. APIs

### 3.1 Gestão de Aplicações

#### Criar Aplicação

```http
POST /api/v1/apps
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "slug": "bee2fleet",
  "name": "Bee2Fleet",
  "description": "Gestão de frotas, viaturas e logística",
  "baseUrl": "https://fleet.bee2.com",
  "icon": "https://cdn.bee2.com/icons/fleet.svg",
  "color": "#3B82F6",
  "docsUrl": "https://docs.bee2.com/fleet",
  "supportUrl": "https://support.bee2.com/fleet"
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "app_abc123",
    "slug": "bee2fleet",
    "name": "Bee2Fleet",
    "description": "Gestão de frotas, viaturas e logística",
    "baseUrl": "https://fleet.bee2.com",
    "icon": "https://cdn.bee2.com/icons/fleet.svg",
    "color": "#3B82F6",
    "status": "DRAFT",
    "isCore": false,
    "isPublic": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Listar Aplicações

```http
GET /api/v1/apps
Authorization: Bearer {admin_token}

# Query params opcionais:
# ?status=ACTIVE
# ?isPublic=true
# ?search=fleet
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "app_abc123",
      "slug": "bee2fleet",
      "name": "Bee2Fleet",
      "description": "Gestão de frotas, viaturas e logística",
      "icon": "https://cdn.bee2.com/icons/fleet.svg",
      "color": "#3B82F6",
      "status": "ACTIVE",
      "baseUrl": "https://fleet.bee2.com",
      "permissionCount": 24,
      "planCount": 3
    },
    {
      "id": "app_def456",
      "slug": "bee2vision",
      "name": "Bee2Vision",
      "description": "Videovigilância e monitorização",
      "icon": "https://cdn.bee2.com/icons/vision.svg",
      "color": "#10B981",
      "status": "ACTIVE",
      "baseUrl": "https://vision.bee2.com",
      "permissionCount": 18,
      "planCount": 3
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "perPage": 20
  }
}
```

#### Obter Detalhes da Aplicação

```http
GET /api/v1/apps/{appId}
Authorization: Bearer {admin_token}
```

**Response: 200 OK**
```json
{
  "data": {
    "id": "app_abc123",
    "slug": "bee2fleet",
    "name": "Bee2Fleet",
    "description": "Gestão de frotas, viaturas e logística",
    "baseUrl": "https://fleet.bee2.com",
    "loginUrl": null,
    "docsUrl": "https://docs.bee2.com/fleet",
    "supportUrl": "https://support.bee2.com/fleet",
    "icon": "https://cdn.bee2.com/icons/fleet.svg",
    "color": "#3B82F6",
    "status": "ACTIVE",
    "isCore": false,
    "isPublic": true,
    "publishedAt": "2024-01-20T10:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-20T10:00:00Z",
    
    "oauth": {
      "clientId": "fleet_client_abc123",
      "redirectUris": [
        "https://fleet.bee2.com/api/auth/callback/apphub",
        "http://localhost:3001/api/auth/callback/apphub"
      ],
      "scopes": ["openid", "profile", "email", "organization"],
      "grantTypes": ["authorization_code", "refresh_token"]
    },
    
    "stats": {
      "permissionCount": 24,
      "scopeTypeCount": 4,
      "planCount": 3,
      "activeLicenses": 47
    }
  }
}
```

#### Actualizar Aplicação

```http
PATCH /api/v1/apps/{appId}
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "Bee2Fleet Pro",
  "description": "Gestão avançada de frotas",
  "status": "ACTIVE"
}
```

**Response: 200 OK**
```json
{
  "data": {
    "id": "app_abc123",
    "slug": "bee2fleet",
    "name": "Bee2Fleet Pro",
    "description": "Gestão avançada de frotas",
    "status": "ACTIVE",
    "updatedAt": "2024-01-25T10:00:00Z"
  }
}
```

#### Alterar Estado da Aplicação

```http
POST /api/v1/apps/{appId}/status
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "status": "SUSPENDED",
  "reason": "Manutenção programada"
}
```

---

### 3.2 Credenciais OAuth

#### Obter Credenciais

```http
GET /api/v1/apps/{appId}/oauth
Authorization: Bearer {super_admin_token}
```

**Response: 200 OK**
```json
{
  "data": {
    "clientId": "fleet_client_abc123",
    "clientSecretHint": "****xyz789",
    "redirectUris": [
      "https://fleet.bee2.com/api/auth/callback/apphub"
    ],
    "scopes": ["openid", "profile", "email", "organization"],
    "grantTypes": ["authorization_code", "refresh_token"],
    "tokenLifetime": 3600,
    "refreshTokenLifetime": 604800,
    "createdAt": "2024-01-15T10:00:00Z",
    "secretRotatedAt": null
  }
}
```

#### Gerar/Regenerar Credenciais

```http
POST /api/v1/apps/{appId}/oauth/credentials
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "regenerateSecret": true  // false para gerar inicial
}
```

**Response: 200 OK**
```json
{
  "data": {
    "clientId": "fleet_client_abc123",
    "clientSecret": "secret_live_abc123xyz789...",  // Mostrado apenas UMA VEZ
    "warning": "Guarde o client_secret. Não será possível visualizá-lo novamente."
  }
}
```

#### Actualizar Configuração OAuth

```http
PATCH /api/v1/apps/{appId}/oauth
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "redirectUris": [
    "https://fleet.bee2.com/api/auth/callback/apphub",
    "https://staging.fleet.bee2.com/api/auth/callback/apphub",
    "http://localhost:3001/api/auth/callback/apphub"
  ],
  "tokenLifetime": 7200,
  "refreshTokenLifetime": 1209600
}
```

---

### 3.3 Permissões

#### Listar Permissões da App

```http
GET /api/v1/apps/{appId}/permissions
Authorization: Bearer {admin_token}

# Query params opcionais:
# ?resource=vehicles
# ?group=Veículos
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "perm_001",
      "slug": "vehicles:read",
      "name": "Ver Veículos",
      "description": "Permite visualizar lista de veículos",
      "resource": "vehicles",
      "action": "read",
      "group": "Veículos",
      "isSystem": false,
      "isDefault": true
    },
    {
      "id": "perm_002",
      "slug": "vehicles:write",
      "name": "Editar Veículos",
      "description": "Permite criar e editar veículos",
      "resource": "vehicles",
      "action": "write",
      "group": "Veículos",
      "isSystem": false,
      "isDefault": false
    }
  ],
  "meta": {
    "total": 24,
    "byResource": {
      "vehicles": 4,
      "drivers": 4,
      "trips": 6,
      "reports": 3,
      "settings": 7
    }
  }
}
```

#### Registar/Criar Permissão

```http
POST /api/v1/apps/{appId}/permissions
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "slug": "vehicles:delete",
  "name": "Eliminar Veículos",
  "description": "Permite eliminar veículos do sistema",
  "resource": "vehicles",
  "action": "delete",
  "group": "Veículos",
  "isDefault": false
}
```

#### Sincronizar Permissões (Bulk)

Permite que a app registe todas as suas permissões de uma vez. Remove permissões que já não existem.

```http
POST /api/v1/apps/{appId}/permissions/sync
Authorization: Bearer {app_service_token}
Content-Type: application/json

{
  "permissions": [
    {
      "slug": "vehicles:read",
      "name": "Ver Veículos",
      "resource": "vehicles",
      "action": "read",
      "group": "Veículos",
      "isDefault": true
    },
    {
      "slug": "vehicles:write",
      "name": "Editar Veículos",
      "resource": "vehicles",
      "action": "write",
      "group": "Veículos"
    },
    {
      "slug": "vehicles:delete",
      "name": "Eliminar Veículos",
      "resource": "vehicles",
      "action": "delete",
      "group": "Veículos"
    },
    {
      "slug": "drivers:read",
      "name": "Ver Motoristas",
      "resource": "drivers",
      "action": "read",
      "group": "Motoristas",
      "isDefault": true
    }
  ]
}
```

**Response: 200 OK**
```json
{
  "data": {
    "created": 2,
    "updated": 2,
    "deleted": 0,
    "total": 4
  }
}
```

#### Eliminar Permissão

```http
DELETE /api/v1/apps/{appId}/permissions/{permissionId}
Authorization: Bearer {super_admin_token}
```

---

### 3.4 Tipos de Scope

#### Listar Tipos de Scope

```http
GET /api/v1/apps/{appId}/scope-types
Authorization: Bearer {admin_token}
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "scope_001",
      "slug": "full_access",
      "name": "Acesso Total",
      "description": "Acesso a todos os dados da organização",
      "requiresSelection": false,
      "multiSelect": false,
      "optionsEndpoint": null
    },
    {
      "id": "scope_002",
      "slug": "customer",
      "name": "Cliente",
      "description": "Limita acesso a um cliente específico",
      "requiresSelection": true,
      "multiSelect": false,
      "optionsEndpoint": "/api/v1/scope-options/customers"
    },
    {
      "id": "scope_003",
      "slug": "region",
      "name": "Região",
      "description": "Limita acesso a uma região geográfica",
      "requiresSelection": true,
      "multiSelect": false,
      "optionsEndpoint": "/api/v1/scope-options/regions"
    }
  ]
}
```

#### Registar Tipo de Scope

```http
POST /api/v1/apps/{appId}/scope-types
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "slug": "vehicle_group",
  "name": "Grupo de Viaturas",
  "description": "Limita acesso a um grupo específico de viaturas",
  "requiresSelection": true,
  "multiSelect": true,
  "optionsEndpoint": "/api/v1/scope-options/vehicle-groups",
  "valueSchema": {
    "type": "object",
    "properties": {
      "group_ids": {
        "type": "array",
        "items": { "type": "string" }
      }
    },
    "required": ["group_ids"]
  }
}
```

#### Sincronizar Tipos de Scope

```http
POST /api/v1/apps/{appId}/scope-types/sync
Authorization: Bearer {app_service_token}
Content-Type: application/json

{
  "scopeTypes": [
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
    }
  ]
}
```

---

### 3.5 Planos

#### Listar Planos

```http
GET /api/v1/apps/{appId}/plans
Authorization: Bearer {admin_token}

# Query params opcionais:
# ?isActive=true
# ?isPublic=true
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "plan_001",
      "slug": "basic",
      "name": "Básico",
      "description": "Para pequenas empresas",
      "price": 49.99,
      "currency": "EUR",
      "billingCycle": "monthly",
      "limits": {
        "maxUsers": 5,
        "maxVehicles": 20,
        "maxStorageGb": 10
      },
      "features": {
        "liveTracking": true,
        "reports": false,
        "apiAccess": false,
        "customBranding": false
      },
      "isActive": true,
      "isPublic": true,
      "isTrial": false
    },
    {
      "id": "plan_002",
      "slug": "professional",
      "name": "Profissional",
      "description": "Para empresas em crescimento",
      "price": 149.99,
      "currency": "EUR",
      "billingCycle": "monthly",
      "limits": {
        "maxUsers": 25,
        "maxVehicles": 100,
        "maxStorageGb": 50
      },
      "features": {
        "liveTracking": true,
        "reports": true,
        "apiAccess": true,
        "customBranding": false
      },
      "isActive": true,
      "isPublic": true,
      "isTrial": false
    },
    {
      "id": "plan_003",
      "slug": "trial",
      "name": "Período de Teste",
      "description": "14 dias grátis com todas as features",
      "price": 0,
      "billingCycle": null,
      "limits": {
        "maxUsers": 10,
        "maxVehicles": 50,
        "maxStorageGb": 20
      },
      "features": {
        "liveTracking": true,
        "reports": true,
        "apiAccess": true,
        "customBranding": true
      },
      "isActive": true,
      "isPublic": true,
      "isTrial": true,
      "trialDays": 14
    }
  ]
}
```

#### Criar Plano

```http
POST /api/v1/apps/{appId}/plans
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "slug": "enterprise",
  "name": "Enterprise",
  "description": "Para grandes organizações",
  "price": 499.99,
  "currency": "EUR",
  "billingCycle": "monthly",
  "limits": {
    "maxUsers": -1,
    "maxVehicles": -1,
    "maxStorageGb": 500
  },
  "features": {
    "liveTracking": true,
    "reports": true,
    "apiAccess": true,
    "customBranding": true,
    "sla": true,
    "dedicatedSupport": true
  },
  "isPublic": false
}
```

#### Actualizar Plano

```http
PATCH /api/v1/apps/{appId}/plans/{planId}
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "price": 549.99,
  "limits": {
    "maxStorageGb": 1000
  }
}
```

---

### 3.6 Webhooks

#### Listar Webhooks

```http
GET /api/v1/apps/{appId}/webhooks
Authorization: Bearer {super_admin_token}
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "webhook_001",
      "url": "https://fleet.bee2.com/api/webhooks/apphub",
      "events": [
        "user.created",
        "user.updated",
        "user.deleted",
        "license.activated",
        "license.suspended"
      ],
      "isActive": true,
      "lastTriggeredAt": "2024-01-25T14:30:00Z",
      "lastStatus": 200,
      "failureCount": 0
    }
  ]
}
```

#### Criar Webhook

```http
POST /api/v1/apps/{appId}/webhooks
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "url": "https://fleet.bee2.com/api/webhooks/apphub",
  "events": [
    "user.created",
    "user.updated",
    "user.deleted",
    "organization.updated",
    "license.activated",
    "license.suspended",
    "license.cancelled"
  ]
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "webhook_001",
    "url": "https://fleet.bee2.com/api/webhooks/apphub",
    "events": ["user.created", "..."],
    "secret": "whsec_abc123xyz789...",  // Mostrado apenas UMA VEZ
    "isActive": true,
    "warning": "Guarde o secret. Não será possível visualizá-lo novamente."
  }
}
```

#### Testar Webhook

```http
POST /api/v1/apps/{appId}/webhooks/{webhookId}/test
Authorization: Bearer {super_admin_token}
```

**Response: 200 OK**
```json
{
  "data": {
    "success": true,
    "statusCode": 200,
    "responseTime": 145,
    "response": { "received": true }
  }
}
```

---

### 3.7 Opções de Scope (Proxy)

Quando o admin está a configurar um scope para um utilizador, o apphub busca as opções disponíveis à app.

```http
GET /api/v1/apps/{appId}/scope-options/{scopeType}?orgId={organizationId}
Authorization: Bearer {admin_token}
```

O apphub faz internamente:
```http
GET {app.baseUrl}/api/v1/scope-options/{scopeType}
Authorization: Bearer {service_token}
X-Tenant-ID: {organizationId}
```

**Response: 200 OK**
```json
{
  "data": [
    { "id": "cust_001", "name": "Loja Xpto", "meta": { "city": "Lisboa" } },
    { "id": "cust_002", "name": "Fábrica YZ", "meta": { "city": "Porto" } },
    { "id": "cust_003", "name": "Empresa ABC", "meta": { "city": "Braga" } }
  ]
}
```

---

## 4. Eventos (Webhooks)

### 4.1 Lista de Eventos

| Evento | Descrição |
|--------|-----------|
| `user.created` | Novo utilizador criado na organização |
| `user.updated` | Dados do utilizador alterados |
| `user.deleted` | Utilizador removido |
| `user.suspended` | Utilizador suspenso |
| `user.activated` | Utilizador activado |
| `organization.updated` | Dados da organização alterados |
| `organization.settings.updated` | Configurações da organização alteradas |
| `membership.created` | Utilizador adicionado à organização |
| `membership.updated` | Papel/scope do utilizador alterado |
| `membership.deleted` | Utilizador removido da organização |
| `license.activated` | Licença activada |
| `license.updated` | Licença alterada (plano, limites) |
| `license.suspended` | Licença suspensa |
| `license.cancelled` | Licença cancelada |
| `license.expired` | Licença expirou |

### 4.2 Formato do Payload

```json
{
  "id": "evt_abc123",
  "type": "user.created",
  "timestamp": "2024-01-25T14:30:00Z",
  "appId": "app_fleet",
  
  "organization": {
    "id": "org_xyz789",
    "slug": "empresa-abc"
  },
  
  "data": {
    "userId": "user_123",
    "email": "joao@empresa.pt",
    "name": "João Silva",
    "roles": ["fleet_operator"],
    "scope": {
      "type": "customer",
      "value": { "customer_id": "cust_001" }
    }
  },
  
  "actor": {
    "type": "user",
    "id": "user_admin_456",
    "email": "admin@empresa.pt"
  }
}
```

### 4.3 Validação de Assinatura

A app deve validar a assinatura do webhook:

```typescript
// Na app (bee2fleet)
import crypto from 'crypto'

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expected}`)
  )
}

// Uso no handler
export async function POST(req: Request) {
  const payload = await req.text()
  const signature = req.headers.get('X-AppHub-Signature')
  
  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const event = JSON.parse(payload)
  // Processar evento...
}
```

---

## 5. Interface de Gestão (UI)

### 5.1 Lista de Aplicações

```
┌─────────────────────────────────────────────────────────────────┐
│  apphub > AppHub                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── Tabs ───────────────────────────────────────────────────┐ │
│  │ Todas │ Activas │ Em Desenvolvimento │ Suspensas │         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🔍 Pesquisar apps...                    [ + Nova Aplicação ]   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ┌─────┐                                                    ││
│  │  │ 🚗  │  Bee2Fleet                           ● ACTIVA     ││
│  │  └─────┘  Gestão de frotas e logística                     ││
│  │           fleet.bee2.com                                    ││
│  │                                                             ││
│  │           📋 24 permissões  📊 3 planos  🔑 47 licenças     ││
│  │                                                             ││
│  │                              [ Configurar ]  [ Ver ]        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ┌─────┐                                                    ││
│  │  │ 🎥  │  Bee2Vision                          ● ACTIVA     ││
│  │  └─────┘  Videovigilância e monitorização                  ││
│  │           vision.bee2.com                                   ││
│  │                                                             ││
│  │           📋 18 permissões  📊 3 planos  🔑 32 licenças     ││
│  │                                                             ││
│  │                              [ Configurar ]  [ Ver ]        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ┌─────┐                                                    ││
│  │  │ ⚡  │  Bee2Energy                         ○ DRAFT       ││
│  │  └─────┘  Gestão de energia e consumos                     ││
│  │           energy.bee2.com                                   ││
│  │                                                             ││
│  │           📋 0 permissões   📊 0 planos   🔑 0 licenças     ││
│  │                                                             ││
│  │                              [ Configurar ]  [ Ver ]        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Detalhes da Aplicação

```
┌─────────────────────────────────────────────────────────────────┐
│  apphub > AppHub > Bee2Fleet                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────┐  Bee2Fleet                              [ Editar ]     │
│  │ 🚗  │  Gestão de frotas e logística                         │
│  └─────┘  https://fleet.bee2.com                ● ACTIVA       │
│                                                                 │
│  ┌─── Tabs ───────────────────────────────────────────────────┐ │
│  │ Geral │ OAuth │ Permissões │ Scopes │ Planos │ Webhooks │  │ │
│  └───────────────┬────────────────────────────────────────────┘ │
│                  ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      CREDENCIAIS OAUTH                      ││
│  │                                                             ││
│  │  Client ID                                                  ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ fleet_client_abc123def456                       📋  │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  │                                                             ││
│  │  Client Secret                                              ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ ••••••••••••••••••••••••••••••xyz789            🔄  │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  │  Última rotação: 15 Jan 2024          [ Regenerar Secret ] ││
│  │                                                             ││
│  │  ──────────────────────────────────────────────────────    ││
│  │                                                             ││
│  │  Redirect URIs                                              ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ https://fleet.bee2.com/api/auth/callback/apphub   │   ││
│  │  │ http://localhost:3001/api/auth/callback/apphub    │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  │                                        [ + Adicionar URI ] ││
│  │                                                             ││
│  │  ──────────────────────────────────────────────────────    ││
│  │                                                             ││
│  │  Configuração de Tokens                                     ││
│  │                                                             ││
│  │  Access Token Lifetime     Refresh Token Lifetime           ││
│  │  ┌───────────────────┐     ┌───────────────────┐           ││
│  │  │ 3600          ▼  │ seg │ 604800        ▼  │ seg        ││
│  │  └───────────────────┘     └───────────────────┘           ││
│  │  (1 hora)                  (7 dias)                        ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│                                         [ Cancelar ] [ Guardar ]│
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Gestão de Permissões

```
┌─────────────────────────────────────────────────────────────────┐
│  apphub > AppHub > Bee2Fleet > Permissões                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔍 Pesquisar permissões...              [ + Nova Permissão ]   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  VEÍCULOS                                            4      ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                                                             ││
│  │  ☑️ vehicles:read          Ver Veículos                     ││
│  │     Permite visualizar lista de veículos         [Default] ││
│  │                                                             ││
│  │  ☐ vehicles:write         Editar Veículos                   ││
│  │     Permite criar e editar veículos                         ││
│  │                                                             ││
│  │  ☐ vehicles:delete        Eliminar Veículos                 ││
│  │     Permite eliminar veículos do sistema                    ││
│  │                                                             ││
│  │  ☐ vehicles:export        Exportar Veículos                 ││
│  │     Permite exportar lista de veículos                      ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  MOTORISTAS                                          4      ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                                                             ││
│  │  ☑️ drivers:read          Ver Motoristas                    ││
│  │     Permite visualizar lista de motoristas       [Default] ││
│  │                                                             ││
│  │  ☐ drivers:write          Editar Motoristas                 ││
│  │     Permite criar e editar motoristas                       ││
│  │                                                             ││
│  │  ...                                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  VIAGENS                                             6      ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  ...                                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│                    [ Sincronizar da App ]  [ Guardar Alterações ]│
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Gestão de Planos

```
┌─────────────────────────────────────────────────────────────────┐
│  apphub > AppHub > Bee2Fleet > Planos                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                              [ + Novo Plano ]   │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │    BÁSICO     │  │ PROFISSIONAL  │  │  ENTERPRISE   │       │
│  │               │  │               │  │               │       │
│  │   49,99€/mês  │  │  149,99€/mês  │  │  499,99€/mês  │       │
│  │               │  │               │  │               │       │
│  │  ───────────  │  │  ───────────  │  │  ───────────  │       │
│  │               │  │               │  │               │       │
│  │  5 utilizad.  │  │ 25 utilizad.  │  │  Ilimitados   │       │
│  │  20 viaturas  │  │ 100 viaturas  │  │  Ilimitadas   │       │
│  │  10 GB        │  │  50 GB        │  │  500 GB       │       │
│  │               │  │               │  │               │       │
│  │  ───────────  │  │  ───────────  │  │  ───────────  │       │
│  │               │  │               │  │               │       │
│  │  ✓ Tracking   │  │  ✓ Tracking   │  │  ✓ Tracking   │       │
│  │  ✗ Relatórios │  │  ✓ Relatórios │  │  ✓ Relatórios │       │
│  │  ✗ API        │  │  ✓ API        │  │  ✓ API        │       │
│  │  ✗ Branding   │  │  ✗ Branding   │  │  ✓ Branding   │       │
│  │               │  │               │  │               │       │
│  │  ───────────  │  │  ───────────  │  │  ───────────  │       │
│  │               │  │               │  │               │       │
│  │  12 licenças  │  │  28 licenças  │  │  7 licenças   │       │
│  │               │  │               │  │               │       │
│  │  [ Editar ]   │  │  [ Editar ]   │  │  [ Editar ]   │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Fluxo de Registo de Nova App

### 6.1 Passo a Passo

```
┌─────────────────────────────────────────────────────────────────┐
│  Registar Nova Aplicação                                    ✕   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ● Passo 1    ○ Passo 2    ○ Passo 3    ○ Passo 4              │
│  Informação   OAuth        Permissões   Planos                  │
│  ─────────────────────────────────────────────────              │
│                                                                 │
│  INFORMAÇÃO BÁSICA                                              │
│                                                                 │
│  Slug (identificador único)                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ bee2parking                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Será usado em URLs e integrações. Não pode ser alterado.       │
│                                                                 │
│  Nome                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Bee2Parking                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Descrição                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Gestão de parques de estacionamento                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  URL Base                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ https://parking.bee2.com                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Ícone                                                          │
│  ┌──────────┐                                                  │
│  │    🅿️    │  [ Upload ]  ou  [ Escolher emoji ]              │
│  └──────────┘                                                  │
│                                                                 │
│  Cor Primária                                                   │
│  ┌──────────┐                                                  │
│  │ #8B5CF6  │  🟣                                              │
│  └──────────┘                                                  │
│                                                                 │
│                                   [ Cancelar ]  [ Próximo → ]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Checklist de Registo

```
┌─────────────────────────────────────────────────────────────────┐
│  apphub > AppHub > Bee2Parking                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠️ Esta aplicação está em modo DRAFT.                          │
│     Complete a configuração para a publicar.                    │
│                                                                 │
│  CHECKLIST DE CONFIGURAÇÃO                                      │
│                                                                 │
│  ✅ Informação básica                                           │
│     Nome, descrição, URLs configurados                          │
│                                                                 │
│  ✅ Credenciais OAuth                                           │
│     Client ID e Secret gerados                                  │
│                                                                 │
│  ⬜ Redirect URIs                                               │
│     Adicione pelo menos um URI de callback                      │
│     [ Configurar ]                                              │
│                                                                 │
│  ⬜ Permissões                                                  │
│     Registe as permissões da aplicação (0 registadas)           │
│     [ Configurar ]                                              │
│                                                                 │
│  ⬜ Tipos de Scope (opcional)                                   │
│     Configure tipos de âmbito de acesso                         │
│     [ Configurar ]                                              │
│                                                                 │
│  ⬜ Planos                                                      │
│     Defina pelo menos um plano de licenciamento                 │
│     [ Configurar ]                                              │
│                                                                 │
│  ⬜ Webhooks (opcional)                                         │
│     Configure endpoints para receber eventos                    │
│     [ Configurar ]                                              │
│                                                                 │
│  ⬜ Teste de Integração                                         │
│     Verifique que a autenticação funciona                       │
│     [ Testar ]                                                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Quando tudo estiver configurado:                               │
│                                                                 │
│  [ Publicar Aplicação ]  (altera estado para ACTIVE)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Segurança

### 7.1 Armazenamento de Secrets

```typescript
// Gerar client secret
import crypto from 'crypto'

function generateClientSecret(): { raw: string; hash: string } {
  const raw = `secret_live_${crypto.randomBytes(32).toString('base64url')}`
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

// Armazenar apenas o hash
await prisma.oAuthClient.update({
  where: { appId },
  data: { clientSecret: hash }
})

// Retornar o raw apenas uma vez
return { clientSecret: raw }
```

### 7.2 Validação de Redirect URIs

```typescript
function validateRedirectUri(uri: string, allowedUris: string[]): boolean {
  // Verificar match exacto
  if (allowedUris.includes(uri)) return true
  
  // Em desenvolvimento, permitir localhost
  if (process.env.NODE_ENV === 'development') {
    const url = new URL(uri)
    if (url.hostname === 'localhost') return true
  }
  
  return false
}
```

### 7.3 Rate Limiting

```typescript
// Limites por endpoint
const RATE_LIMITS = {
  'POST /api/v1/apps': { window: '1h', max: 10 },
  'POST /api/v1/apps/:id/oauth/credentials': { window: '1h', max: 5 },
  'POST /api/v1/apps/:id/permissions/sync': { window: '1m', max: 10 },
  'POST /api/v1/apps/:id/webhooks/:id/test': { window: '1m', max: 5 }
}
```

---

## 8. Permissões Necessárias

### 8.1 Permissões do AppHub

| Permissão | Descrição |
|-----------|-----------|
| `apps:read` | Ver lista e detalhes de apps |
| `apps:write` | Criar e editar apps |
| `apps:delete` | Eliminar apps |
| `apps:publish` | Publicar/suspender apps |
| `apps:oauth:read` | Ver credenciais OAuth |
| `apps:oauth:write` | Gerar/regenerar credenciais |
| `apps:permissions:read` | Ver permissões de apps |
| `apps:permissions:write` | Gerir permissões de apps |
| `apps:plans:read` | Ver planos de apps |
| `apps:plans:write` | Gerir planos de apps |
| `apps:webhooks:read` | Ver webhooks de apps |
| `apps:webhooks:write` | Gerir webhooks de apps |

### 8.2 Papéis Recomendados

```
Super Admin (Plataforma)
├── apps:* (todas as permissões)

App Manager
├── apps:read
├── apps:write
├── apps:oauth:read
├── apps:permissions:*
├── apps:plans:*
├── apps:webhooks:*

App Viewer
├── apps:read
├── apps:oauth:read (sem ver secrets)
├── apps:permissions:read
├── apps:plans:read
```

---

## 9. Integração com Outros Módulos

### 9.1 Com Licenciamento

> **IMPORTANTE**: O acesso a apps é concedido exclusivamente através de Licenças (`License`), cada uma associada a um Plano (`Plan`) e Entidade (`Entity`). A data de associação = `License.validFrom`.

```
AppHub                          Licenciamento
───────                         ─────────────
App                             License
 └── Plan ─────────────────────► planId
     │                           │
     │                           └──► entityId
     │                           └──► validFrom (data de associação)
     │                           └──► status (ACTIVE/TRIAL/CANCELLED/EXPIRED)
                                 
Quando uma licença é criada:
1. Verifica se app existe e está activa
2. Verifica se plano existe e está activo
3. Aplica limites e features do plano
4. Define validFrom como data de associação
```

#### Modelo de Acesso Unificado

- **Não existe** acesso direto sem plano/licença
- Entidades obtêm acesso a apps através de:
  - **Self-service**: Utilizadores com papel `owner`/`admin` podem seleccionar um plano e criar uma licença
  - **Admin**: Administradores do sistema podem atribuir licenças a entidades
- `License.validFrom` representa a "data de associação" da entidade com a app

### 9.2 Com RBAC

```
AppHub                          RBAC
───────                         ────
Permission ────────────────────► RolePermission
                                     │
                                     ▼
                                 Role
                                     │
                                     ▼
                                 MembershipRole
```

### 9.3 Com OAuth Provider

```
AppHub                          OAuth Provider
───────                         ──────────────
OAuthClient ───────────────────► Token Generation
    │                                │
    ├── clientId                     ├── Validar client
    ├── clientSecret                 ├── Validar secret
    ├── redirectUris                 ├── Validar redirect
    └── scopes                       └── Incluir scopes
```

---

## 10. Checklist de Implementação

### Fase 8 — AppHub

#### 8.1 Modelo de Dados
- [ ] Modelo App no Prisma
- [ ] Modelo OAuthClient no Prisma
- [ ] Modelo Permission no Prisma
- [ ] Modelo AppScopeType no Prisma
- [ ] Modelo Plan no Prisma
- [ ] Modelo AppWebhook no Prisma
- [ ] Modelo AppTenantSettings no Prisma
- [ ] Executar migrations

#### 8.2 APIs de Aplicações
- [ ] POST /api/v1/apps — Criar app
- [ ] GET /api/v1/apps — Listar apps
- [ ] GET /api/v1/apps/:id — Detalhes da app
- [ ] PATCH /api/v1/apps/:id — Actualizar app
- [ ] POST /api/v1/apps/:id/status — Alterar estado
- [ ] DELETE /api/v1/apps/:id — Eliminar app

#### 8.3 APIs de OAuth
- [ ] GET /api/v1/apps/:id/oauth — Obter configuração
- [ ] POST /api/v1/apps/:id/oauth/credentials — Gerar/regenerar
- [ ] PATCH /api/v1/apps/:id/oauth — Actualizar configuração

#### 8.4 APIs de Permissões
- [ ] GET /api/v1/apps/:id/permissions — Listar
- [ ] POST /api/v1/apps/:id/permissions — Criar
- [ ] PATCH /api/v1/apps/:id/permissions/:id — Actualizar
- [ ] DELETE /api/v1/apps/:id/permissions/:id — Eliminar
- [ ] POST /api/v1/apps/:id/permissions/sync — Sincronizar

#### 8.5 APIs de Scope Types
- [ ] GET /api/v1/apps/:id/scope-types — Listar
- [ ] POST /api/v1/apps/:id/scope-types — Criar
- [ ] PATCH /api/v1/apps/:id/scope-types/:id — Actualizar
- [ ] DELETE /api/v1/apps/:id/scope-types/:id — Eliminar
- [ ] POST /api/v1/apps/:id/scope-types/sync — Sincronizar
- [ ] GET /api/v1/apps/:id/scope-options/:type — Proxy opções

#### 8.6 APIs de Planos
- [ ] GET /api/v1/apps/:id/plans — Listar
- [ ] POST /api/v1/apps/:id/plans — Criar
- [ ] PATCH /api/v1/apps/:id/plans/:id — Actualizar
- [ ] DELETE /api/v1/apps/:id/plans/:id — Eliminar

#### 8.7 APIs de Webhooks
- [ ] GET /api/v1/apps/:id/webhooks — Listar
- [ ] POST /api/v1/apps/:id/webhooks — Criar
- [ ] PATCH /api/v1/apps/:id/webhooks/:id — Actualizar
- [ ] DELETE /api/v1/apps/:id/webhooks/:id — Eliminar
- [ ] POST /api/v1/apps/:id/webhooks/:id/test — Testar

#### 8.8 Segurança
- [ ] Geração segura de client_id e client_secret
- [ ] Hash de secrets na BD
- [ ] Validação de redirect URIs
- [ ] Rate limiting
- [ ] Permissões de acesso

#### 8.9 Interface (UI)
- [ ] Página de listagem de apps
- [ ] Página de detalhes/configuração
- [ ] Formulário de criação de app
- [ ] Gestão de credenciais OAuth
- [ ] Gestão de permissões
- [ ] Gestão de scope types
- [ ] Gestão de planos
- [ ] Gestão de webhooks
- [ ] Wizard de registo de nova app
- [ ] Checklist de configuração

#### 8.10 Webhooks
- [ ] Sistema de dispatch de eventos
- [ ] Assinatura de payloads (HMAC)
- [ ] Retry com backoff exponencial
- [ ] Registo de entregas (logs)

---

*Versão: 1.0*
*Data: Novembro 2024*
