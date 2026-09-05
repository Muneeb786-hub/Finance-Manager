import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const UpdateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  color: z.string().default("#10b981"),
  icon: z.string().default("tag"),
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
    const existing = await db.category.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Category not found or cannot be modified" }, { status: 404 })
    }

    const body = await request.json()
    const validated = UpdateCategorySchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ errors: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const updated = await db.category.update({
      where: { id },
      data: {
        name: validated.data.name,
        color: validated.data.color,
        icon: validated.data.icon,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Category PATCH error:", error)
    return NextResponse.json({ message: "Failed to update category" }, { status: 500 })
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
    const existing = await db.category.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Category not found or cannot be deleted" }, { status: 404 })
    }

    if (existing.isDefault) {
      return NextResponse.json({ message: "Default system categories cannot be deleted" }, { status: 400 })
    }

    // Check if category has transactions or budgets linked
    const txCount = await db.transaction.count({ where: { categoryId: id } })
    if (txCount > 0) {
      return NextResponse.json(
        { message: `Cannot delete category with ${txCount} existing transactions. Reassign transactions first.` },
        { status: 400 }
      )
    }

    const budgetCount = await db.budget.count({ where: { categoryId: id } })
    if (budgetCount > 0) {
      return NextResponse.json(
        { message: "Cannot delete category linked to active monthly budgets. Remove budgets first." },
        { status: 400 }
      )
    }

    await db.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Category DELETE error:", error)
    return NextResponse.json({ message: "Failed to delete category" }, { status: 500 })
  }
}
