# Changelog

All notable changes to the Personal Finance Manager project will be documented in this file.

## [0.11.0] - 2026-09-06
### Added
- Milestone 11: End-to-End Integration Test Suite, Web App Manifest & Offline Assets, and API Documentation Finalization.
- Comprehensive financial lifecycle integration test suite (`tests/integration/flow.test.ts`) covering user registration, multi-account decimal precision cash flows, budget threshold warnings, savings milestones, recurring date advancement, health score evaluations, month-over-month shifts, and double-confirmation data wipe.
- Next.js 14 App Router web app manifest (`src/app/manifest.ts`) providing PWA installation capabilities, custom theme colors, and standalone window configuration.
- Completely finalized REST API documentation (`docs/api.md`) indexing all 30+ endpoints across Authentication, Accounts, Categories, Transactions, Budgets, Goals, Recurring Cash Flow, Financial Insights, Analytics, Notifications, Onboarding, and Data Portability.

## [0.10.0] - 2026-09-06
### Added
- Milestone 10: Guided Setup Tour, First-Time User Onboarding Wizard, and Sandbox Demo Mode.
- Onboarding completion API endpoint (`/api/onboarding/complete`) saving user profile preferences, initial account balances, first budget limit, and savings goal in an atomic transaction.
- Realistic sandbox demo data seeder (`src/lib/demo-data.ts` and `/api/onboarding/seed-demo`) generating 3-month historical income and expense transactions, category budgets, savings milestones, and recurring schedules.
- Multi-step interactive `OnboardingWizard` modal with 5 progression stages (Profile, Initial Ledger, Budget, Savings Goal, and Clean vs Sandbox Launch).
- Dashboard Welcome & Sandbox Tour banner with 1-click guided wizard launcher and instant sandbox data loader.
- Settings page Sandbox Demo section allowing on-demand sample data population for testing and evaluation.
- Unit tests verifying onboarding setup schema validation, initial balance constraints, and default fallback parameters (`tests/unit/onboarding.test.ts`).

## [0.9.0] - 2026-09-05
### Added
- Milestone 9: User Profile, Accounts & Categories Configuration, and Data Management Settings.
- User profile & preferences API (`/api/auth/profile`) for display name, base currency (USD, EUR, GBP, CAD, AUD, JPY, PKR, INR), and timezone configuration.
- Password change API (`/api/auth/change-password`) with bcrypt validation of current credentials and secure hashing.
- Accounts management endpoints (`/api/accounts/[id]`) for editing account details and safe deletion with transaction unlinking.
- Categories customization endpoints (`/api/categories/[id]`) with color palette picker and delete guards for system defaults and linked transactions.
- Data portability and backup export endpoint (`/api/account-data`) delivering a complete JSON archive of all transactions, budgets, goals, and schedules.
- Double-confirmation account data wipe API (`DELETE /api/account-data`) with strict phrase verification (`DELETE MY DATA`).
- Dedicated `/settings` dashboard featuring tabbed navigation across Profile & Security, Accounts, Categories, and Data Privacy.
- Unit tests validating profile schemas, password change constraints, and data wipe double confirmation (`tests/unit/settings.test.ts`).

## [0.8.0] - 2026-09-05
### Added
- Milestone 8: Notifications Center and Real-Time Alerts Management.
- Notifications API collection endpoints (`/api/notifications`, `/api/notifications/[id]`) supporting unread filtering, type categorization, single toggle, bulk mark-as-read, and clearing actions.
- Notification schema validation for alert payloads (`src/lib/validations.ts`).
- Dedicated `/notifications` management center with all/unread tabs, search filtering, category tabs (Budget Alerts, Recurring Flows, Goal Milestones, Financial Insights), and empty state views.
- Interactive notification item cards with relative timestamps, alert type badges, inline read toggling, and deletion controls.
- Active unread notification indicator badge in the top navigation bar with auto-refresh polling.
- Unit tests validating notification schema requirements, unread count filtering, and type groupings (`tests/unit/notifications.test.ts`).

## [0.7.0] - 2026-09-05
### Added
- Milestone 7: Financial Insights, Health Scoring, and Deep-Dive Analytics.
- Automated server-side financial calculation engine (`src/lib/insights.ts`) computing holistic health scores (0-100), 50/30/20 guideline allocations, month-over-month category variance shifts, and prioritized educational observations.
- Financial insights API endpoints (`/api/financial-insights`) for real-time evaluations and persistent historical snapshot archiving.
- Visual financial analytics API endpoint (`/api/analytics`) calculating multi-month cash flow trajectories, payment method distributions, and daily spending velocity.
- Dedicated `/insights` dashboard with interactive health score circular gauge, 50/30/20 benchmark progress bars, observation alerts, month-over-month comparison table, and snapshot history.
- Dedicated `/analytics` dashboard with 3, 6, and 12-month timeframe toggles, composed trajectory charts, itemized category progress table, and payment channel distribution.
- Unit tests verifying financial health scoring algorithms, 50/30/20 allocations, month-over-month variance detection, and period cash flow metrics (`tests/unit/insights.test.ts`, `tests/unit/analytics.test.ts`).

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
