import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AssetSchema } from "@/lib/validations"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id } = params

  try {
    const existing = await db.asset.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ message: "Asset not found" }, { status: 404 })
    }

    const body = await req.json()
    const validated = AssetSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { message: "Invalid asset data", errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updated = await db.asset.update({
      where: { id },
      data: {
        name: validated.data.name,
        category: validated.data.category,
        value: validated.data.value,
        quantity: validated.data.quantity ?? null,
        unit: validated.data.unit ?? null,
        notes: validated.data.notes ?? null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Asset PUT error:", error)
    return NextResponse.json({ message: "Failed to update asset" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id } = params

  try {
    const existing = await db.asset.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ message: "Asset not found" }, { status: 404 })
    }

    await db.asset.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Asset deleted successfully" })
  } catch (error) {
    console.error("Asset DELETE error:", error)
    return NextResponse.json({ message: "Failed to delete asset" }, { status: 500 })
  }
}
