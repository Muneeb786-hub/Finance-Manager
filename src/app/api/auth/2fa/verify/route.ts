import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { verifyTwoFactorToken, generateBackupCodes } from "@/lib/two-factor"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const { secret, code } = await req.json()

    if (!secret || !code) {
      return NextResponse.json(
        { message: "Secret and 6-digit verification code are required" },
        { status: 400 }
      )
    }

    const isValid = verifyTwoFactorToken(code, secret)
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid verification code. Please make sure your authenticator clock is synced." },
        { status: 400 }
      )
    }

    // Generate 8 one-time emergency backup recovery codes
    const backupCodes = generateBackupCodes(8)

    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: backupCodes,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Two-Factor Authentication enabled successfully",
      backupCodes,
    })
  } catch (err: any) {
    console.error("Failed to verify and enable 2FA:", err)
    return NextResponse.json({ message: "Failed to enable 2FA" }, { status: 500 })
  }
}
