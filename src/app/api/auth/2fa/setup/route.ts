import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateTwoFactorSetup } from "@/lib/two-factor"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const setupData = await generateTwoFactorSetup(session.user.email)
    return NextResponse.json(setupData)
  } catch (err: any) {
    console.error("Failed to generate 2FA setup:", err)
    return NextResponse.json({ message: "Failed to generate 2FA setup" }, { status: 500 })
  }
}
