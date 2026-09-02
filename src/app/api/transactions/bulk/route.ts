import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID must be provided"),
})

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const body = await req.json()
    const validated = BulkDeleteSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const result = await db.transaction.deleteMany({
      where: {
        id: { in: validated.data.ids },
        userId,
      },
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} transaction(s)`,
      count: result.count,
    })
  } catch (error) {
    console.error("Bulk delete error:", error)
    return NextResponse.json({ message: "Failed to delete transactions" }, { status: 500 })
  }
}
