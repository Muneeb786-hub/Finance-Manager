import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { verifyTwoFactorToken, verifyAndConsumeBackupCode } from "@/lib/two-factor"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const { password, code } = await req.json()

    if (!password) {
      return NextResponse.json(
        { message: "Current password is required to disable Two-Factor Authentication" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Incorrect password" }, { status: 400 })
    }

    // If a 2FA code is provided, verify it as well for defense in depth
    if (code && user.twoFactorSecret) {
      const isTokenValid = verifyTwoFactorToken(code, user.twoFactorSecret)
      const isBackupValid = verifyAndConsumeBackupCode(code, user.twoFactorBackupCodes).valid
      if (!isTokenValid && !isBackupValid) {
        return NextResponse.json({ message: "Invalid 2FA code" }, { status: 400 })
      }
    }

    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    })

    return NextResponse.json({
      success: true,
      message: "Two-Factor Authentication disabled",
    })
  } catch (err: any) {
    console.error("Failed to disable 2FA:", err)
    return NextResponse.json({ message: "Failed to disable 2FA" }, { status: 500 })
  }
}
