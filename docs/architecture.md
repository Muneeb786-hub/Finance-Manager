# Architecture & System Design

## Overview
Personal Finance Manager is a modern, full-stack web application designed for personal financial management, budgeting, savings goals, recurring cash flow automation, and analytical summaries.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js App Router (Client & SSR)            │
│  - Landing & Authentication (/login, /register)                 │
│  - Dashboard & Visual Analytics (Recharts, React Server Comp)   │
│  - Transaction & Budget Management Interfaces                   │
└────────────────┬───────────────────────────────┬────────────────┘
                 │                               │
                 ▼                               ▼
┌────────────────────────────────┐ ┌──────────────────────────────┐
│       NextAuth / Auth.js       │ │     Next.js API Handlers     │
│  - JWT Session Strategy        │ │  - Zod Request Validation    │
│  - Bcrypt Password Hashing     │ │  - User ID Ownership Guards  │
│  - Route Protection Middleware │ │  - Decimal Precision Engine  │
└────────────────────────────────┘ └─────────────┬────────────────┘
                                                 │
                                                 ▼
                                   ┌──────────────────────────────┐
                                   │      Prisma ORM Client       │
                                   │  - Relational Data Model     │
                                   │  - Strict Cascade Rules      │
                                   └─────────────┬────────────────┘
                                                 │
                                                 ▼
                                   ┌──────────────────────────────┐
                                   │      PostgreSQL Database     │
                                   │  - User Data Isolation       │
                                   │  - Optimized Multi-Indexes   │
                                   └──────────────────────────────┘
```

## Technology Stack
- **Framework**: Next.js 14 (App Router, Server Actions, API Routes)
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS, CSS variables, `next-themes` (Dark/Light mode)
- **Component Primitives**: Radix UI, Lucide Icons, Sonner toasts
- **Forms & Validation**: React Hook Form with Zod schemas
- **Database**: PostgreSQL (accessible via Docker, Neon, Supabase, or local instance)
- **ORM**: Prisma Client with relational foreign keys and composite indexes
- **Financial Calculation Engine**: `decimal.js` for safe arbitrary-precision decimal operations
- **Testing**: Vitest for unit & integration testing, Playwright for E2E workflows

## Data Isolation & Security Principles
1. Every query in the application enforces explicit `userId` filtering.
2. Cross-user access is rejected with a 403 Forbidden or 404 Not Found.
3. Passwords are never stored in plaintext and are salted and hashed using `bcryptjs` with 12 rounds.
