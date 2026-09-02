# Database Schema & Models

The application utilizes PostgreSQL managed through Prisma ORM.

## Relational Schema Diagram
- **User**: Central entity managing profile preferences, currency, and credentials.
- **Account**: Optional financial buckets (Cash, Bank Account, Digital Wallet, Credit Card).
- **Category**: Custom and system categories tagged as `INCOME` or `EXPENSE`.
- **Transaction**: Recorded ledger entries linked to categories, accounts, and tags.
- **Budget**: Monthly targets per category with alert threshold percentages.
- **SavingsGoal**: Financial targets with linked contributions and withdrawals.
- **GoalContribution**: Ledger of deposits and withdrawals towards specific goals.
- **RecurringTransaction**: Automated schedule templates (Daily, Weekly, Monthly, Yearly).
- **Notification**: Alerts for budget boundaries, recurring executions, and goal completions.
- **FinancialInsight**: Historical structured reports and educational summaries.

## Indexes & Constraints
- `User.email`: Unique index.
- `Budget`: Unique composite index on `[userId, categoryId, month, year]` preventing duplicate monthly budgets.
- `Transaction`: Multi-column indexes on `[userId, date]`, `[userId, categoryId]`, and `[userId, type]` for rapid filtering and sorting.
