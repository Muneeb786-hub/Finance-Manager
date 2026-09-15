import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { seedUserDemoData } from "@/lib/demo-data"
import { clearUserFinancialData } from "@/lib/user-data"

export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    await db.$transaction(async (tx) => {
      await clearUserFinancialData(tx, userId, { clearSyncToken: true })
      await seedUserDemoData(userId, tx)
    }, { timeout: 30_000 })
    return NextResponse.json({ message: "Demo workspace reset successfully" })
  } catch (error) {
    console.error("Demo reset failed:", error)
    return NextResponse.json({ message: "Failed to reset demo workspace" }, { status: 500 })
  }
}
