# Development Guide

## Local Environment

1. Install Node.js 20+, npm 9+, and Docker.
2. Run `npm install` and copy `.env.example` to `.env`.
3. Start PostgreSQL with `docker compose up -d`.
4. Apply the schema with `npx prisma migrate deploy` and seed with `npx prisma db seed`.
5. Run `npm run dev` and open `http://localhost:3004`.

The Docker connection is `postgresql://postgres:postgrespassword@localhost:5433/finance_manager?schema=public`.

## Quality Commands

- `npm run lint`: ESLint checks with zero warnings allowed
- `npx tsc --noEmit`: strict TypeScript checking
- `npm test`: unit tests plus non-database lifecycle tests
- `npm run test:integration`: PostgreSQL-backed ownership, precision, concurrency, export, and wipe checks
- `npm run test:e2e`: Chromium portfolio journey
- `npm run build`: production compilation

Use a disposable database for integration and E2E tests. CI creates one with PostgreSQL 16 and runs migrations before testing.

## Demo Walkthrough

Sign in with the seeded account, choose **Reset Demo Workspace** under Settings → Data & Privacy, review Dashboard and Analytics, open **Demo SMS Sync**, approve the fictional charge, preview a CSV import, and download the versioned JSON backup.
