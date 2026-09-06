import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
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
    const existing = await db.linkedAccountSync.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Linked account not found" }, { status: 404 })
    }

    await db.linkedAccountSync.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Account unlinked" })
  } catch (err: any) {
    console.error("Failed to unlink account:", err)
    return NextResponse.json({ message: "Failed to unlink account" }, { status: 500 })
  }
}
