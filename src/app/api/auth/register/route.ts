import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { RegisterSchema } from "@/lib/validations"

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "briefcase", color: "#10b981" },
  { name: "Freelance", icon: "laptop", color: "#06b6d4" },
  { name: "Scholarship", icon: "graduation-cap", color: "#6366f1" },
  { name: "Gift", icon: "gift", color: "#ec4899" },
  { name: "Other", icon: "plus-circle", color: "#64748b" },
]

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food", icon: "utensils", color: "#f97316" },
  { name: "Transport", icon: "car", color: "#3b82f6" },
  { name: "Rent", icon: "home", color: "#8b5cf6" },
  { name: "Bills", icon: "receipt", color: "#eab308" },
  { name: "Education", icon: "book-open", color: "#14b8a6" },
  { name: "Shopping", icon: "shopping-bag", color: "#d946ef" },
  { name: "Entertainment", icon: "film", color: "#f43f5e" },
  { name: "Subscriptions", icon: "repeat", color: "#6366f1" },
  { name: "Health", icon: "activity", color: "#ef4444" },
  { name: "Other", icon: "tag", color: "#64748b" },
]

const DEFAULT_ACCOUNTS = [
  { name: "Cash", type: "CASH", openingBalance: 0 },
  { name: "Bank Account", type: "BANK_ACCOUNT", openingBalance: 0 },
  { name: "Digital Wallet", type: "DIGITAL_WALLET", openingBalance: 0 },
  { name: "Credit Card", type: "CREDIT_CARD", openingBalance: 0 },
]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = RegisterSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input data", errors: validatedData.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password } = validatedData.data
    const normalizedEmail = email.toLowerCase()

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Create user and seed initial categories and accounts in a transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          onboardingComplete: true,
        },
      })

      // Seed categories
      for (const cat of DEFAULT_INCOME_CATEGORIES) {
        await tx.category.create({
          data: {
            userId: newUser.id,
            name: cat.name,
            type: "INCOME",
            icon: cat.icon,
            color: cat.color,
            isDefault: true,
          },
        })
      }

      for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
        await tx.category.create({
          data: {
            userId: newUser.id,
            name: cat.name,
            type: "EXPENSE",
            icon: cat.icon,
            color: cat.color,
            isDefault: true,
          },
        })
      }

      // Seed accounts
      for (const acc of DEFAULT_ACCOUNTS) {
        await tx.account.create({
          data: {
            userId: newUser.id,
            name: acc.name,
            type: acc.type as any,
            openingBalance: acc.openingBalance,
          },
        })
      }

      return newUser
    })

    return NextResponse.json(
      { message: "User registered successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "An unexpected error occurred during registration" },
      { status: 500 }
    )
  }
}
