import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ChangePasswordSchema } from "@/lib/validations"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const body = await request.json()
    const validated = ChangePasswordSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ errors: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ message: "User not found or password login not configured" }, { status: 400 })
    }

    const passwordMatch = await bcrypt.compare(validated.data.currentPassword, user.passwordHash)
    if (!passwordMatch) {
      return NextResponse.json({ message: "Incorrect current password" }, { status: 400 })
    }

    const newHashed = await bcrypt.hash(validated.data.newPassword, 12)
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: newHashed },
    })

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ message: "Failed to change password" }, { status: 500 })
  }
}
