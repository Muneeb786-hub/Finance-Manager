# Database and Migrations

PostgreSQL is accessed through Prisma. Every user-owned model has a `userId` relation with cascade behavior appropriate to its lifecycle.

## Financial Precision

- Monetary fields: `Decimal(19,4)`
- Budget thresholds: `Decimal(5,2)`
- Asset quantities: `Decimal(30,12)`

Application calculations use Decimal helpers. JSON responses remain numeric for compatibility with charts and existing clients.

## Integrity Constraints

- Budget uniqueness: user, category, month, and year
- Recurring occurrence uniqueness: `Transaction.occurrenceKey`
- CSV duplicate uniqueness: `Transaction.importFingerprint`
- Demo webhook uniqueness: user and `PendingSyncTransaction.sourceFingerprint`
- Approved sync linkage: unique `PendingSyncTransaction.transactionId`

## Migration Strategy

Fresh databases run `npx prisma migrate deploy`. Existing databases created through `prisma db push` must first mark `20260901000000_initial` as applied; `20260914000100_financial_integrity` then preserves and casts existing values. See the root README for exact commands.

Do not use `prisma db push` as the normal shared or deployed workflow. Create reviewed migrations for subsequent schema changes.
