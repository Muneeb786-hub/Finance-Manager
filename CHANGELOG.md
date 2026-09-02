# Changelog

All notable changes to the Personal Finance Manager project will be documented in this file.

## [0.1.0] - 2026-09-02
### Added
- Milestone 1: Project foundation and scaffolding with Next.js App Router, TypeScript, and Tailwind CSS.
- NextAuth authentication with credentials provider and bcrypt password hashing.
- Complete Prisma relational schema covering Users, Accounts, Categories, Transactions, Budgets, Goals, Recurring Transactions, Notifications, and Financial Insights.
- Public landing page with product features, privacy statement, and educational disclaimer.
- Sign-in and Sign-up authentication pages with React Hook Form and Zod validation.
- Responsive application layout with desktop sidebar, mobile navigation, and light/dark theme toggle.
- Comprehensive technical documentation suite (`README.md`, `docs/architecture.md`, `docs/security.md`, `docs/development.md`, `docs/database.md`, `docs/api.md`).

## [0.3.0] - 2026-09-02
### Added
- Milestone 3: Comprehensive financial dashboard and visual analytics suite.
- Central aggregated dashboard API (`/api/dashboard`) computing net balances, cash flow metrics, category breakdowns, 6-month trends, budgets, and savings goals.
- Interactive cash flow historical trend chart and category spending donut breakdown powered by Recharts.
- Key financial metric cards for net worth, monthly income, monthly expenses, and cash flow surplus/deficit.
- Monthly budget progress widget with color-coded alert thresholds (`On Track`, `Near Limit`, `Over Budget`).
- Savings goals tracker widget displaying milestones, target dates, and progress bars.
- Upcoming recurring payments schedule widget with due dates and frequencies.
- Recent activity widget and integrated direct transaction creation modal from the dashboard.
- Unit tests covering dashboard aggregations, cash flow calculations, and budget thresholds (`tests/unit/dashboard.test.ts`).
- Dashboard seed data script for sample budgets, savings goals, and recurring transactions (`prisma/seed-dashboard.ts`).

## [0.2.0] - 2026-09-02
### Added
- Milestone 2: Accounts, Categories, and full Transaction management workflow.
- Category listing and custom category creation API endpoints (`/api/categories`).
- Account listing and creation API endpoints (`/api/accounts`).
- Transaction CRUD routes with safe decimal validation (`/api/transactions`, `/api/transactions/[id]`).
- Filter-aware CSV export endpoint (`/api/transactions/export`).
- Bulk selection and bulk delete endpoint with atomic batch deletion (`/api/transactions/bulk`).
- Dedicated `/transactions` management view with searching, multi-filter panels, multi-column sorting, pagination, and modals.
- Unit and integration tests for transaction schema validation and decimal cash flow calculations (`tests/unit/transactions.test.ts`).
- Seed script extension for realistic sample transactions across food, rent, transit, utilities, and income.
