# Changelog

All notable changes to the Personal Finance Manager project will be documented in this file.

## [0.6.0] - 2026-09-03
### Added
- Milestone 6: Recurring Transactions Scheduler and Cash Flow Automation.
- Recurring transactions API endpoints (`/api/recurring-transactions`, `/api/recurring-transactions/[id]`) with daily, weekly, monthly, and yearly frequencies.
- Automated ledger processing endpoint (`/api/recurring-transactions/process`) recording due transactions into the ledger and creating notifications.
- Normalized monthly recurring cash flow calculations and projected net flow analysis (`src/lib/recurring.ts`).
- Dedicated `/recurring` management dashboard with active/paused/all tabs, due schedule banners, and 1-click batch processing.
- Interactive recurring cards with next run date countdowns, status indicators, and pause/resume triggers.
- Unit tests verifying recurring schemas, date advancement math, and cash flow normalization (`tests/unit/recurring.test.ts`).

## [0.5.0] - 2026-09-03
### Added
- Milestone 5: Savings Goals and Financial Milestone Tracking.
- Savings goals API endpoints (`/api/goals`, `/api/goals/[id]`) with target progress percentages, remaining balances, and estimated monthly required savings paces.
- Goal contribution and withdrawal ledger API (`/api/goals/[id]/contributions`) with decimal precision math and automatic milestone completion triggers.
- Dedicated `/goals` management view with active, completed, and all goal filter tabs and summary metrics.
- Interactive goal cards with target date countdowns, pace recommendations, and quick deposit/withdrawal actions.
- Contribution history modal displaying chronological deposits and withdrawals.
- Unit tests verifying savings goal schemas, contribution payloads, withdrawal limits, and pacing calculations (`tests/unit/goals.test.ts`).

## [0.4.0] - 2026-09-02
### Added
- Milestone 4: Category Budgets and Monthly Spending Limits management workflow.
- Monthly budgets API endpoints (`/api/budgets`, `/api/budgets/[id]`) with live expense calculations, status alerts, and unbudgeted category detection.
- Fast copy previous month budgets endpoint (`/api/budgets/copy-previous`) for monthly rollover workflows.
- Dedicated `/budgets` management dashboard with calendar month navigation, summary cards, and responsive budget cards.
- Real-time spending progress bars with threshold alert badges (`On Track`, `Near Limit`, `Over Budget`).
- Modal dialogs for setting, editing, and deleting category budgets.
- Unbudgeted expense warnings identifying spending in categories without configured caps.
- Comprehensive unit tests for budget schema validation, threshold statuses, and remaining buffer math (`tests/unit/budgets.test.ts`).

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

## [0.1.0] - 2026-09-02
### Added
- Milestone 1: Project foundation and scaffolding with Next.js App Router, TypeScript, and Tailwind CSS.
- NextAuth authentication with credentials provider and bcrypt password hashing.
- Complete Prisma relational schema covering Users, Accounts, Categories, Transactions, Budgets, Goals, Recurring Transactions, Notifications, and Financial Insights.
- Public landing page with product features, privacy statement, and educational disclaimer.
- Sign-in and Sign-up authentication pages with React Hook Form and Zod validation.
- Responsive application layout with desktop sidebar, mobile navigation, and light/dark theme toggle.
- Comprehensive technical documentation suite (`README.md`, `docs/architecture.md`, `docs/security.md`, `docs/development.md`, `docs/database.md`, `docs/api.md`).
