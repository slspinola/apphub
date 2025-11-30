# AppHub (bee2hive)

> Central SaaS hub for multi-tenant identity management, user/organization management, and OAuth provider for the Bee2Solutions ecosystem.

[![Next.js](https://img.shields.io/badge/Next.js-16.0.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC)](https://tailwindcss.com/)

## 🚀 Features

### Authentication & Security
- ✅ NextAuth.js v5 with credentials provider
- ✅ Secure password hashing with bcryptjs
- ✅ Password reset flow with token-based verification
- ✅ Email verification for new user registrations
- ✅ JWT session management
- ✅ Protected routes with middleware

### Multi-Tenancy
- ✅ Hierarchical entity/organization structure
- ✅ Entity switching capability
- ✅ Membership-based access control
- ✅ Entity-scoped data isolation

### User Management
- ✅ Complete CRUD operations for users
- ✅ Role-based user management
- ✅ User status management (active, suspended)
- ✅ Invite system (foundation ready)

### UI/UX
- ✅ Modern, responsive dashboard layout
- ✅ Collapsible sidebar navigation
- ✅ Loading states with skeleton loaders
- ✅ Error boundaries for graceful error handling
- ✅ 404 and global error pages
- ✅ shadcn/ui component library integration

### Developer Experience
- ✅ TypeScript with strict mode
- ✅ ESLint + Prettier configuration
- ✅ Feature-based folder structure
- ✅ Server Actions pattern
- ✅ Zod schema validation
- ✅ Environment variable management

## 📋 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js | 16.0.5 |
| **UI Library** | React | 19.2.0 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **Components** | shadcn/ui + Radix UI | Latest |
| **Database** | PostgreSQL (Supabase) | - |
| **ORM** | Prisma | 5.22.0 |
| **Authentication** | NextAuth.js | 5.0.0-beta.30 |
| **Validation** | Zod | 4.1.13 |
| **Forms** | react-hook-form | 7.67.0 |

## 🏗️ Project Structure

```
apphub/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # Authentication pages
│   │   ├── dashboard/        # Dashboard pages
│   │   └── api/              # API routes
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── forms/           # Form components
│   │   └── dashboard/       # Dashboard-specific components
│   ├── features/            # Feature modules
│   │   ├── auth/           # Authentication logic
│   │   ├── entities/       # Entity management
│   │   ├── users/          # User management
│   │   └── system/         # System settings
│   ├── lib/                # Utility libraries
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript types
│   └── middleware.ts       # Next.js middleware
├── public/                 # Static assets
└── config files           # Configuration files
```

## 🚦 Getting Started

### Prerequisites

- Node.js 20.x or later
- PostgreSQL database (Supabase recommended)
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/slspinola/apphub.git
   cd apphub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```env
   # Database
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"

   # Supabase (optional)
   NEXT_PUBLIC_SUPABASE_URL="https://..."
   NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
   SUPABASE_SERVICE_ROLE_KEY="..."
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (pooled) | Yes |
| `DIRECT_URL` | PostgreSQL direct connection (migrations) | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Optional |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Optional |

## 🗄️ Database Schema

### Core Models

- **User** - User accounts with authentication
- **Account** - OAuth provider accounts
- **Session** - User sessions
- **Entity** - Organizations/tenants with hierarchy
- **Membership** - User-Entity relationships
- **PasswordResetToken** - Password reset tokens
- **EmailVerificationToken** - Email verification tokens
- **SystemSettings** - Application configuration

## 🎯 Implementation Roadmap

This project follows a 12-phase implementation plan (see `apphub_implementation_plan.md`):

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Complete | Foundation & Setup |
| 2 | 🟡 70% | Authentication |
| 3 | 🟡 50% | Multi-tenancy |
| 4 | 🟡 40% | User Management |
| 5 | ⬜ 0% | RBAC (Roles & Permissions) |
| 6 | ⬜ 0% | Licensing |
| 7 | ⬜ 0% | OAuth Provider |
| 8 | ⬜ 0% | App Registration |
| 9 | ⬜ 0% | SDK Development |
| 10 | ⬜ 0% | Ecosystem APIs |
| 11 | 🟡 30% | Admin Dashboard |
| 12 | ⬜ 0% | Audit & Logs |

## 🎨 Design System

The project follows the Bee2Solutions brand guidelines (see `apphub_style_guide.md`):

- **Primary Color**: `#f93f26` (Bee2 Red)
- **Typography**: Geist Sans (currently), Funel Display (planned)
- **Components**: shadcn/ui with custom theming
- **Dark Mode**: Supported

## 📚 Documentation

- [Implementation Plan](./apphub_implementation_plan.md) - Detailed 12-phase development plan
- [Style Guide](./apphub_style_guide.md) - Brand and design guidelines
- [Prisma Schema](./prisma/schema.prisma) - Database schema documentation

## 🔒 Security

- Passwords hashed with bcryptjs (10 rounds)
- JWT-based session tokens
- Protected API routes with middleware
- Input validation with Zod schemas
- CSRF protection (via NextAuth)
- Environment variable validation

### Planned Security Enhancements
- Row-Level Security (RLS) policies
- Rate limiting on authentication endpoints
- Audit logging system
- MFA (Multi-Factor Authentication)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Build process or auxiliary tool changes

## 📄 License

This project is proprietary software owned by Bee2Solutions.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative

## 📧 Contact

For questions or support, please contact the Bee2Solutions development team.

---

**Built with ❤️ by Bee2Solutions**
