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
