# Finance Manager

A personal finance app I built to keep track of where my money actually goes. It handles accounts, transactions, budgets, savings goals, assets/net worth and recurring payments, with a dashboard and a few reports on top.

Built with Next.js 15, TypeScript, PostgreSQL + Prisma, Auth.js, Tailwind and Recharts.

![Dashboard](docs/images/dashboard.png)

## Features

- Accounts, categories and transactions, all scoped per user
- Monthly budgets with warnings when you get close to the limit
- Savings goals and an assets page for tracking net worth
- Recurring income/expenses that post automatically (and only once)
- CSV import with a preview step and duplicate detection
- CSV and JSON export
- Two-factor login (TOTP) with backup codes
- Currency switcher and timezone-aware monthly reports
- A demo SMS sync screen that parses Pakistani bank / Easypaisa / JazzCash alerts

Money is stored as fixed-precision decimals in Postgres, not floats.

> The "SMS sync" is a simulator. It doesn't connect to any real bank or wallet. The insights and health score are just there to help organise things, they're not financial advice.

## Running it locally

You'll need Node 20+, npm and Docker.

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Then open http://localhost:3004 and log in with `demo@example.com` / `password123`.

## Tests

```bash
npm run lint
npx tsc --noEmit
npm test                  # unit tests
npm run test:integration  # needs RUN_DATABASE_TESTS=true and a test DB
npm run test:e2e          # run `npx playwright install chromium` first
npm run build
```

## Upgrading an older database

If your database was created with `prisma db push` before migrations were added, mark the first migration as applied and then deploy the rest:

```bash
npx prisma migrate resolve --applied 20260901000000_initial
npx prisma migrate deploy
```

This converts the old float money columns to decimals without dropping data. Take a backup first.

## Docs

- [Architecture](docs/architecture.md)
- [API](docs/api.md)
- [Database](docs/database.md)
- [Security](docs/security.md)
- [Development](docs/development.md)

## License

MIT, see [LICENSE](LICENSE).
