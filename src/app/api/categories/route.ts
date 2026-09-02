import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().default("tag"),
  color: z.string().default("#10b981"),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") as "INCOME" | "EXPENSE" | null

  try {
    const categories = await db.category.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Categories GET error:", error)
    return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const body = await req.json()
    const validated = CreateCategorySchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { message: "Invalid category data", errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Check for duplicate category name for this user and type
    const existing = await db.category.findFirst({
      where: {
        userId,
        name: { equals: validated.data.name, mode: "insensitive" },
        type: validated.data.type,
      },
    })

    if (existing) {
      return NextResponse.json(
        { message: "A category with this name and type already exists" },
        { status: 409 }
      )
    }

    const category = await db.category.create({
      data: {
        userId,
        name: validated.data.name,
        type: validated.data.type,
        icon: validated.data.icon,
        color: validated.data.color,
        isDefault: false,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Categories POST error:", error)
    return NextResponse.json({ message: "Failed to create category" }, { status: 500 })
  }
}
