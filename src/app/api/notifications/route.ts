import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NotificationSchema } from "@/lib/validations"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const type = searchParams.get("type")
    const search = searchParams.get("search")

    const where: any = { userId }
    if (unreadOnly) {
      where.isRead = false
    }
    if (type && type !== "ALL") {
      where.type = type
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ]
    }

    const [notifications, unreadCount, totalCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      db.notification.count({
        where: { userId, isRead: false },
      }),
      db.notification.count({
        where: { userId },
      }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      totalCount,
    })
  } catch (error) {
    console.error("Notifications GET error:", error)
    return NextResponse.json({ message: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json({ message: "All notifications marked as read" })
  } catch (error) {
    console.error("Notifications bulk read PATCH error:", error)
    return NextResponse.json({ message: "Failed to mark notifications as read" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") // 'read' or 'all'

    if (filter === "read") {
      await db.notification.deleteMany({
        where: { userId, isRead: true },
      })
      return NextResponse.json({ message: "Read notifications cleared" })
    }

    await db.notification.deleteMany({
      where: { userId },
    })

    return NextResponse.json({ message: "All notifications cleared" })
  } catch (error) {
    console.error("Notifications bulk DELETE error:", error)
    return NextResponse.json({ message: "Failed to clear notifications" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const body = await request.json()
    const validated = NotificationSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ errors: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const notification = await db.notification.create({
      data: {
        userId,
        type: validated.data.type,
        title: validated.data.title,
        message: validated.data.message,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error("Notifications POST error:", error)
    return NextResponse.json({ message: "Failed to create notification" }, { status: 500 })
  }
}
