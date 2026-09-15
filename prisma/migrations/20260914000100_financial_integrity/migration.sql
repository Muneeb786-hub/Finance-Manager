-- Preserve existing values while moving all financial amounts away from floating-point storage.
ALTER TABLE "Account" ALTER COLUMN "openingBalance" TYPE DECIMAL(19,4) USING "openingBalance"::DECIMAL(19,4);
ALTER TABLE "Transaction" ALTER COLUMN "amount" TYPE DECIMAL(19,4) USING "amount"::DECIMAL(19,4);
ALTER TABLE "Budget" ALTER COLUMN "amount" TYPE DECIMAL(19,4) USING "amount"::DECIMAL(19,4);
ALTER TABLE "Budget" ALTER COLUMN "alertThreshold" TYPE DECIMAL(5,2) USING "alertThreshold"::DECIMAL(5,2);
ALTER TABLE "SavingsGoal" ALTER COLUMN "targetAmount" TYPE DECIMAL(19,4) USING "targetAmount"::DECIMAL(19,4);
ALTER TABLE "SavingsGoal" ALTER COLUMN "currentAmount" TYPE DECIMAL(19,4) USING "currentAmount"::DECIMAL(19,4);
ALTER TABLE "GoalContribution" ALTER COLUMN "amount" TYPE DECIMAL(19,4) USING "amount"::DECIMAL(19,4);
ALTER TABLE "RecurringTransaction" ALTER COLUMN "amount" TYPE DECIMAL(19,4) USING "amount"::DECIMAL(19,4);
ALTER TABLE "PendingSyncTransaction" ALTER COLUMN "amount" TYPE DECIMAL(19,4) USING "amount"::DECIMAL(19,4);
ALTER TABLE "Asset" ALTER COLUMN "value" TYPE DECIMAL(19,4) USING "value"::DECIMAL(19,4);
ALTER TABLE "Asset" ALTER COLUMN "quantity" TYPE DECIMAL(30,12) USING "quantity"::DECIMAL(30,12);

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "occurrenceKey" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "importFingerprint" TEXT;
ALTER TABLE "PendingSyncTransaction" ADD COLUMN IF NOT EXISTS "sourceFingerprint" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_occurrenceKey_key" ON "Transaction"("occurrenceKey");
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_importFingerprint_key" ON "Transaction"("importFingerprint");
CREATE UNIQUE INDEX IF NOT EXISTS "PendingSyncTransaction_userId_sourceFingerprint_key" ON "PendingSyncTransaction"("userId", "sourceFingerprint");
CREATE UNIQUE INDEX IF NOT EXISTS "PendingSyncTransaction_transactionId_key" ON "PendingSyncTransaction"("transactionId");
