import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { encryptTwoFactorSecret, verifyTwoFactorToken, generateBackupCodes, hashBackupCodes } from "@/lib/two-factor"
import { checkRateLimit, getClientAddress, rateLimitResponse } from "@/lib/rate-limit"
import { z } from "zod"
import bcrypt from "bcryptjs"

const VerifySetupSchema = z.object({
  secret: z.string().min(16).max(256),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(1).optional(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  const rate = checkRateLimit("2fa-verify", `${userId}:${getClientAddress(req)}`, 8, 10 * 60 * 1000)
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

  try {
    const parsed = VerifySetupSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ message: "Secret and 6-digit verification code are required" }, { status: 400 })
    const { secret, code, password } = parsed.data

    const currentUser = await db.user.findUnique({ where: { id: userId }, select: { twoFactorEnabled: true, passwordHash: true } })
    if (currentUser?.twoFactorEnabled) {
      if (!password || !currentUser.passwordHash || !(await bcrypt.compare(password, currentUser.passwordHash))) {
        return NextResponse.json({ message: "Current password is required to replace Two-Factor Authentication" }, { status: 403 })
      }
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
    const backupCodeHashes = await hashBackupCodes(backupCodes)

    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptTwoFactorSecret(secret),
        twoFactorBackupCodes: backupCodeHashes,
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
