# REST API Documentation

All protected routes require an active NextAuth session cookie (`next-auth.session-token`). All requests and responses use JSON formatting unless explicitly stated otherwise (such as CSV transaction export and JSON backup downloads).

---

## Authentication & User Profile
- `POST /api/auth/register`: Create a new user account, hash passwords with 12 bcrypt rounds, and seed initial default categories and accounts.
- `POST /api/auth/[...nextauth]`: NextAuth credential login and session verification handler.
- `GET /api/auth/profile`: Fetch current authenticated user's profile metadata, base currency, and timezone.
- `PATCH /api/auth/profile`: Update user display name, preferred currency, and timezone.
- `POST /api/auth/change-password`: Verify current password and securely hash new password credentials.

## Accounts & Categories
- `GET /api/accounts`: Fetch all financial accounts and ledgers owned by the authenticated user.
- `POST /api/accounts`: Create a new financial account (name, account type, opening balance).
- `PATCH /api/accounts/[id]`: Update account metadata or opening balance.
- `DELETE /api/accounts/[id]`: Safe account deletion with automatic transaction unlinking.
- `GET /api/categories`: Fetch user-owned and default categories (filterable by `type=INCOME` or `type=EXPENSE`).
- `POST /api/categories`: Create a new custom category with color code and icon.
- `PATCH /api/categories/[id]`: Update custom category name, color, or icon.
- `DELETE /api/categories/[id]`: Guarded deletion preventing removal of default categories or categories with recorded transactions.

## Transactions & Ledger
- `GET /api/transactions`: Paginated, filtered, and sorted transactions with date range, category, type, account, and search queries.
- `POST /api/transactions`: Create an income or expense transaction with safe decimal validation.
- `PATCH /api/transactions/[id]`: Update transaction details.
- `DELETE /api/transactions/[id]`: Delete an individual transaction.
- `POST /api/transactions/bulk`: Batch delete transactions with atomic verification.
- `POST /api/transactions/export`: Filter-aware CSV export of transactions for spreadsheets.

## Dashboard & Analytics
- `GET /api/dashboard`: Aggregated dashboard metrics: net total balance, current month cash flow, 6-month trends, category breakdowns, budget alerts, and active goals.
- `GET /api/analytics`: Multi-month cash flow trajectory (3, 6, 12 months), itemized category percentage share, payment method channels, and daily spending velocity.

## Budgets
- `GET /api/budgets`: Monthly category spending limits with live consumption status (`ON_TRACK`, `APPROACHING`, `OVER_BUDGET`).
- `POST /api/budgets`: Set or update a monthly category budget cap with custom alert thresholds.
- `DELETE /api/budgets/[id]`: Remove a monthly category budget.
- `POST /api/budgets/copy-previous`: 1-click rollover to copy all active budget limits from the preceding month.

## Savings Goals & Milestones
- `GET /api/goals`: Active and archived savings goals with progress percentages, remaining buffer, and required monthly pacing.
- `POST /api/goals`: Create a new savings goal with target date and milestone amount.
- `PATCH /api/goals/[id]`: Edit goal metadata or status.
- `DELETE /api/goals/[id]`: Remove a savings goal and its associated ledger.
- `POST /api/goals/[id]/contributions`: Record a deposit or withdrawal contribution with atomic goal balance updates.

## Recurring Cash Flow
- `GET /api/recurring-transactions`: List active and paused recurring transaction rules.
- `POST /api/recurring-transactions`: Establish a recurring rule with daily, weekly, monthly, or yearly frequency.
- `PATCH /api/recurring-transactions/[id]`: Update recurring parameters or toggle active/paused status.
- `DELETE /api/recurring-transactions/[id]`: Delete a recurring schedule.
- `POST /api/recurring-transactions/process`: Process all due recurring transactions, create ledger entries, advance next run dates, and dispatch notifications.

## Financial Insights
- `GET /api/financial-insights`: Real-time evaluation of holistic Financial Health Score (0–100), 50/30/20 guideline breakdown, month-over-month category variance shifts, and prioritized educational observations.
- `POST /api/financial-insights`: Generate and archive a persistent financial health evaluation snapshot.

## Notifications Center
- `GET /api/notifications`: Retrieve user notifications with unread filtering, type categorization, and search.
- `PATCH /api/notifications`: Mark all notifications as read.
- `DELETE /api/notifications`: Clear read notifications or purge all notifications.
- `PATCH /api/notifications/[id]`: Toggle read status for an individual notification.
- `DELETE /api/notifications/[id]`: Delete a specific notification.

## Onboarding & Sandbox Demo Mode
- `POST /api/onboarding/complete`: Save user profile choices, initial account balances, budget, and goal in an atomic transaction and set `onboardingComplete: true`.
- `POST /api/onboarding/seed-demo`: Populate realistic 3-month sample transactions, budgets, goals, and recurring rules for sandbox exploration.

## Data Portability & Privacy
- `GET /api/account-data`: Export a complete, portable JSON backup containing all user financial records.
- `DELETE /api/account-data`: Irreversible full data wipe with double confirmation requiring the exact verification phrase (`DELETE MY DATA`).
