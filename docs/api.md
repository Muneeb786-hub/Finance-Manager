# REST API Documentation

All protected routes require an active NextAuth session cookie.

## Authentication
- `POST /api/auth/register`: Create a new user account and seed default categories.
- `POST /api/auth/[...nextauth]`: NextAuth handler for credentials login and session verification.

## Core Resources
- `GET /api/dashboard`: Aggregated balance, current month cash flow, budgets, and recurring preview.
- `GET /api/transactions`: Paginated, filtered, and sorted transactions.
- `POST /api/transactions`: Create a transaction with decimal validation.
- `POST /api/transactions/export`: Filtered CSV transaction export.
- `GET /api/categories`: User-owned and default categories.
- `GET /api/budgets`: Monthly category budgets with live spending status.
- `POST /api/budgets`: Create or update a category budget.
- `GET /api/goals`: Savings goals with progress percentages.
- `POST /api/goals/[id]/contributions`: Record a goal deposit or withdrawal.
- `POST /api/recurring-transactions/process`: Trigger due recurring transaction processing.
- `POST /api/financial-insights`: Generate server-side educational insights.
- `DELETE /api/account-data`: Full account data wipe with double confirmation.
