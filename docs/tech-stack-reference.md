# Application Tech Stack & Architecture Reference

## Document Purpose
Technical reference for building applications within the ecosystem. Defines the recommended technology stack, architecture patterns, and integration standards.

---

## 1. Technology Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.x | Full-stack React framework with App Router |
| **React** | 19.x | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |

### Database & ORM
| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | - | Primary relational database |
| **Prisma** | 5.22.x | ORM and database migrations |
| **Supabase** | 2.86.x | Database hosting & storage (optional) |

### Authentication & Authorization
| Technology | Version | Purpose |
|------------|---------|---------|
| **NextAuth.js** | 5.x (beta) | Authentication framework (Auth.js) |
| **bcryptjs** | 3.x | Password hashing |

### UI & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Radix UI** | - | Headless accessible components |
| **shadcn/ui** | new-york style | Pre-built component library |
| **Lucide React** | 0.555.x | Icon library |
| **next-themes** | 0.4.x | Theme switching (dark/light mode) |
| **class-variance-authority** | 0.7.x | Component variants |
| **tailwind-merge** | 3.4.x | Tailwind class merging |
| **clsx** | 2.1.x | Conditional class names |

### Form Handling & Validation
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Hook Form** | 7.67.x | Form state management |
| **Zod** | 4.1.x | Schema validation |
| **@hookform/resolvers** | 5.2.x | Form + Zod integration |

### Notifications & Feedback
| Technology | Version | Purpose |
|------------|---------|---------|
| **Sonner** | 2.0.x | Toast notifications |

---

## 2. Architecture Patterns

### 2.1 Server Actions (Data Mutations)

Use **Next.js Server Actions** for all data mutations:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createVehicleSchema, type CreateVehicleInput } from './schemas'

export async function createVehicle(input: CreateVehicleInput) {
  // 1. Authorization check
  await requirePermission('vehicles:write')
  
  // 2. Input validation with Zod
  const validated = createVehicleSchema.parse(input)
  
  // 3. Database operation
  const vehicle = await prisma.vehicle.create({
    data: validated,
  })
  
  // 4. Cache invalidation
  revalidatePath('/vehicles')
  
  return vehicle
}
```

**Key Principles:**
- Always validate inputs with Zod schemas
- Check authorization at the start
- Use `revalidatePath()` for cache invalidation
- Return data or throw errors (caught by error boundaries)

### 2.2 Schema Validation

Define Zod schemas for all inputs and derive TypeScript types:

```typescript
import { z } from 'zod'

export const createVehicleSchema = z.object({
  licensePlate: z.string().min(1).max(20),
  brand: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1900).max(2100),
  status: z.enum(['active', 'maintenance', 'retired']).default('active'),
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>

export const updateVehicleSchema = createVehicleSchema.partial()
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
```

### 2.3 Prisma Database Pattern

Use a singleton pattern for the Prisma client:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### 2.4 Authentication with NextAuth.js v5

```typescript
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const { auth, signIn, signOut, handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)
        
        if (!parsed.success) return null
        
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email }
        })
        
        if (!user?.passwordHash) return null
        
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        return valid ? user : null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})
```

### 2.5 Middleware Pattern

```typescript
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth(async function middleware(req) {
  const session = req.auth
  
  // Define public paths
  const publicPaths = ['/login', '/register', '/forgot-password']
  const isPublicPath = publicPaths.some(p => req.nextUrl.pathname.startsWith(p))
  
  if (isPublicPath || !session) {
    return NextResponse.next()
  }
  
  // Add custom validation logic here
  
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
```

### 2.6 Authorization Pattern

Role-based permission system:

```typescript
import { auth } from '@/auth'

export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  ADMIN: 'admin',
  USER: 'user',
} as const

export async function requirePermission(permission: string) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error('Unauthorized: Not authenticated')
  }
  
  // System admin has all permissions
  if (session.user.role === ROLES.SYSTEM_ADMIN) {
    return true
  }
  
  // Check specific permission
  const hasPermission = await checkUserPermission(session.user.id, permission)
  
  if (!hasPermission) {
    throw new Error('Forbidden: Insufficient permissions')
  }
  
  return true
}

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  
  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    isSystemAdmin: session.user.role === ROLES.SYSTEM_ADMIN,
  }
}
```

---

## 3. UI Component Patterns

### 3.1 shadcn/ui Configuration

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 3.2 Utility Function

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 3.3 Form Component Pattern

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createVehicle } from '@/features/vehicles/actions'
import { createVehicleSchema, type CreateVehicleInput } from '@/features/vehicles/schemas'

export function CreateVehicleForm() {
  const form = useForm<CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      licensePlate: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
    },
  })

  const onSubmit = async (data: CreateVehicleInput) => {
    try {
      await createVehicle(data)
      toast.success('Vehicle created successfully')
      form.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create vehicle')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="licensePlate">License Plate</Label>
        <Input
          id="licensePlate"
          {...form.register('licensePlate')}
          placeholder="ABC-1234"
        />
        {form.formState.errors.licensePlate && (
          <p className="text-sm text-destructive">
            {form.formState.errors.licensePlate.message}
          </p>
        )}
      </div>
      
      {/* More fields... */}
      
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Creating...' : 'Create Vehicle'}
      </Button>
    </form>
  )
}
```

### 3.4 Server Component Data Fetching

```tsx
// app/vehicles/page.tsx
import { getVehicles } from '@/features/vehicles/actions'
import { VehicleList } from '@/components/vehicles/vehicle-list'

export default async function VehiclesPage() {
  const { data: vehicles, meta } = await getVehicles()
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vehicles</h1>
      <VehicleList vehicles={vehicles} />
    </div>
  )
}
```

---

## 4. TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 5. Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DIRECT_URL=postgresql://user:pass@host:5432/dbname

# Authentication
NEXTAUTH_SECRET=generate-a-secure-secret
NEXTAUTH_URL=http://localhost:3000

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AppHub Integration
APPHUB_CLIENT_ID=your-oauth-client-id
APPHUB_CLIENT_SECRET=your-oauth-client-secret
APPHUB_BASE_URL=https://apphub.example.com
```

---

## 6. Key Patterns Summary

| Pattern | Technology | Usage |
|---------|------------|-------|
| **Data Mutations** | Server Actions | All create/update/delete operations |
| **Data Fetching** | Server Components | Page-level data loading |
| **Form Handling** | React Hook Form + Zod | All user input forms |
| **Styling** | Tailwind CSS + CSS Variables | All styling |
| **Components** | shadcn/ui (Radix) | Base component library |
| **Authentication** | NextAuth.js v5 (JWT) | User sessions |
| **Authorization** | Role-based | Permission checks |
| **Database** | Prisma + PostgreSQL | Data persistence |
| **Validation** | Zod | Input/output schemas |
| **Notifications** | Sonner | User feedback |
| **Icons** | Lucide React | All iconography |
| **Theming** | next-themes | Dark/light mode |

---

## 7. Package.json Dependencies

```json
{
  "dependencies": {
    "@auth/prisma-adapter": "^2.11.1",
    "@hookform/resolvers": "^5.2.2",
    "@prisma/client": "^5.22.0",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@supabase/supabase-js": "^2.86.0",
    "bcryptjs": "^3.0.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.555.0",
    "next": "^15.0.3",
    "next-auth": "^5.0.0-beta.25",
    "next-themes": "^0.4.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.67.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.4.0",
    "zod": "^4.1.13"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.0.3",
    "eslint-config-prettier": "^10.1.8",
    "prettier": "^3.7.2",
    "prisma": "^5.22.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

