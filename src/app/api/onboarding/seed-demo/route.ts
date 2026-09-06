import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { seedUserDemoData } from "@/lib/demo-data"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    await seedUserDemoData(userId)
    return NextResponse.json({ message: "Sandbox demo data successfully loaded!" })
  } catch (error) {
    console.error("Seed demo data error:", error)
    return NextResponse.json({ message: "Failed to populate sandbox demo data" }, { status: 500 })
  }
}
