import { z } from "zod"

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const TransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  categoryId: z.string().min(1, "Category is required"),
  accountId: z.string().optional().nullable(),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  paymentMethod: z.string().default("OTHER"),
  tags: z.array(z.string()).default([]),
})

export const BudgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Budget amount must be greater than 0"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  alertThreshold: z.coerce.number().min(1).max(100).default(80),
})

export const SavingsGoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  targetAmount: z.coerce.number().positive("Target amount must be greater than 0"),
  currentAmount: z.coerce.number().min(0).default(0),
  targetDate: z.string().optional().nullable(),
  icon: z.string().default("target"),
  color: z.string().default("#3b82f6"),
  notes: z.string().optional().nullable(),
})

export const GoalContributionSchema = z.object({
  goalId: z.string().min(1, "Goal ID is required"),
  amount: z.coerce.number().positive("Contribution must be greater than 0"),
  type: z.enum(["CONTRIBUTION", "WITHDRAWAL"]).default("CONTRIBUTION"),
  note: z.string().optional().nullable(),
})

export const RecurringTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  categoryId: z.string().min(1, "Category is required"),
  accountId: z.string().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  paymentMethod: z.string().default("OTHER"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
})

export const ProfileSettingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  preferredCurrency: z.string().default("USD"),
  timezone: z.string().default("UTC"),
})

export const NotificationSchema = z.object({
  type: z.string().min(1, "Notification type is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
})

export const AccountDataWipeSchema = z.object({
  confirmationPhrase: z.literal("DELETE MY DATA", {
    errorMap: () => ({ message: 'Please type "DELETE MY DATA" exactly to confirm' }),
  }),
})
