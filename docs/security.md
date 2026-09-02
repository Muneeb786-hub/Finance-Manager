# Security & Privacy Documentation

## Data Ownership & Multi-Tenancy Isolation
Every data model (`Account`, `Category`, `Transaction`, `Budget`, `SavingsGoal`, `GoalContribution`, `RecurringTransaction`, `Notification`, `FinancialInsight`) contains a foreign key to `User.id`.
- Mutating endpoints verify that `session.user.id` equals the owner ID before any write or delete.
- Listing endpoints query explicitly with `where: { userId: session.user.id }`.

## Authentication & Session Security
- Authenticated sessions are tokenized through signed JSON Web Tokens (JWT) using NextAuth.
- Passwords are validated using `bcryptjs` with a work factor of 12 rounds.
- CSRF protection is provided out-of-the-box by Next.js and NextAuth.

## Private Data & Bank Connection Disclaimer
Personal Finance Manager is intentionally engineered as an offline-first and self-directed personal finance system:
- **No live bank integrations**: The app never connects to external banking networks (e.g., Plaid, MX, Yodlee).
- All account details and financial records are entered solely by the user for private tracking.
- Complete data removal can be executed at any time in the Settings portal.
