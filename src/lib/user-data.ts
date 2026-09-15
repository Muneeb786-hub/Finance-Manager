import { Prisma } from "@prisma/client"

export async function clearUserFinancialData(
  client: Prisma.TransactionClient,
  userId: string,
  options: { resetOnboarding?: boolean; clearSyncToken?: boolean } = {}
) {
  await client.pendingSyncTransaction.deleteMany({ where: { userId } })
  await client.linkedAccountSync.deleteMany({ where: { userId } })
  await client.asset.deleteMany({ where: { userId } })
  await client.goalContribution.deleteMany({ where: { userId } })
  await client.savingsGoal.deleteMany({ where: { userId } })
  await client.budget.deleteMany({ where: { userId } })
  await client.transaction.deleteMany({ where: { userId } })
  await client.recurringTransaction.deleteMany({ where: { userId } })
  await client.financialInsight.deleteMany({ where: { userId } })
  await client.notification.deleteMany({ where: { userId } })
  await client.account.deleteMany({ where: { userId } })
  await client.category.deleteMany({ where: { userId, isDefault: false } })
  await client.user.update({
    where: { id: userId },
    data: {
      ...(options.resetOnboarding ? { onboardingComplete: false } : {}),
      ...(options.clearSyncToken ? { syncWebhookToken: null } : {}),
    },
  })
}
