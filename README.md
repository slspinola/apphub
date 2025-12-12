# AppHub

A modern Next.js application with authentication, multi-tenancy, and user management.

## Features

- **Authentication**: Secure login/register with NextAuth.js
- **Multi-tenancy**: Organization/Entity management
- **User Management**: Role-based access control (RBAC)
- **Modern UI**: Built with Tailwind CSS and Shadcn UI

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Prisma (PostgreSQL)
- Tailwind CSS
- NextAuth.js v5

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `npm run dev`

## Environment Variables

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Secret key for NextAuth v5 JWT encryption/decryption (generate with `openssl rand -base64 32`)

Optional environment variables:

- `NEXTAUTH_URL` - Base URL of your application (defaults to `http://localhost:3000` in development)

## Deployment

This project is configured for deployment on Vercel.
- Automatically runs `prisma generate` on build
- Requires `DATABASE_URL` and `AUTH_SECRET` environment variables

**Important**: NextAuth v5 uses `AUTH_SECRET` (not `NEXTAUTH_SECRET`). If you're migrating from NextAuth v4, update your environment variables accordingly.
