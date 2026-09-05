import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const UpdateNotificationSchema = z.object({
  isRead: z.boolean(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id } = params

  try {
    const existing = await db.notification.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 })
    }

    const body = await request.json()
    const validated = UpdateNotificationSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ errors: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: validated.data.isRead },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Notification single PATCH error:", error)
    return NextResponse.json({ message: "Failed to update notification" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id } = params

  try {
    const existing = await db.notification.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 })
    }

    await db.notification.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Notification deleted" })
  } catch (error) {
    console.error("Notification single DELETE error:", error)
    return NextResponse.json({ message: "Failed to delete notification" }, { status: 500 })
  }
}
