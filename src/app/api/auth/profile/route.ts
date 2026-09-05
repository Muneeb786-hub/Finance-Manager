import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ProfileSettingsSchema } from "@/lib/validations"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        preferredCurrency: true,
        timezone: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Profile GET error:", error)
    return NextResponse.json({ message: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const body = await request.json()
    const validated = ProfileSettingsSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ errors: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name: validated.data.name,
        preferredCurrency: validated.data.preferredCurrency,
        timezone: validated.data.timezone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        preferredCurrency: true,
        timezone: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Profile PATCH error:", error)
    return NextResponse.json({ message: "Failed to update profile" }, { status: 500 })
  }
}
