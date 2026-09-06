import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id } = params

  try {
    const pending = await db.pendingSyncTransaction.findUnique({
      where: { id },
    })

    if (!pending || pending.userId !== userId) {
      return NextResponse.json({ message: "Pending transaction not found" }, { status: 404 })
    }

    await db.pendingSyncTransaction.update({
      where: { id },
      data: { status: "DISMISSED" },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Failed to dismiss transaction:", err)
    return NextResponse.json({ message: "Failed to dismiss transaction" }, { status: 500 })
  }
}
