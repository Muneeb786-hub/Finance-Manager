"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tag, Plus, Trash2, Edit2, ShieldAlert } from "lucide-react"

export interface CategoryRecord {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
  color: string
  icon: string
  isDefault: boolean
}

interface CategoriesSettingsTabProps {
  categories: CategoryRecord[]
  onRefresh: () => void
}

const PRESET_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#f59e0b", // amber
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#64748b", // slate
]

export function CategoriesSettingsTab({ categories, onRefresh }: CategoriesSettingsTabProps) {
  const [activeType, setActiveType] = useState<"EXPENSE" | "INCOME">("EXPENSE")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null)

  // Form states
  const [name, setName] = useState("")
  const [color, setColor] = useState("#10b981")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const filteredCategories = categories.filter((c) => c.type === activeType)

  const openAddModal = () => {
    setName("")
    setColor(PRESET_COLORS[0])
    setErrorMsg(null)
    setIsAddOpen(true)
  }

  const openEditModal = (cat: CategoryRecord) => {
    setEditingCategory(cat)
    setName(cat.name)
    setColor(cat.color)
    setErrorMsg(null)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    const isEdit = !!editingCategory
    const url = isEdit ? `/api/categories/${editingCategory.id}` : "/api/categories"
    const method = isEdit ? "PATCH" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type: activeType,
          color,
          icon: "tag",
        }),
      })

      if (res.ok) {
        setIsAddOpen(false)
        setEditingCategory(null)
        onRefresh()
      } else {
        const data = await res.json()
        setErrorMsg(data.message || "Failed to save category")
      }
    } catch (err) {
      setErrorMsg("A network error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      if (res.ok) {
        onRefresh()
      } else {
        const data = await res.json()
        alert(data.message || "Cannot delete category")
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Spending &amp; Income Categories</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Organize budgets, transaction tags, and spending breakdowns with custom classifications
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Type selector */}
            <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60 text-xs">
              <Button
                variant={activeType === "EXPENSE" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setActiveType("EXPENSE")}
              >
                Expenses
              </Button>
              <Button
                variant={activeType === "INCOME" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setActiveType("INCOME")}
              >
                Income
              </Button>
            </div>

            <Button size="sm" onClick={openAddModal} className="h-8 gap-1.5 text-xs shadow-xs">
              <Plus className="h-3.5 w-3.5" />
              Add Category
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="p-3.5 rounded-xl border border-border bg-card/60 hover:bg-muted/30 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-foreground block truncate">
                    {cat.name}
                  </span>
                  {cat.isDefault ? (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                      Default
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Custom</span>
                  )}
                </div>
              </div>

              {!cat.isDefault && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(cat)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="Edit category"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Delete category"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      {/* Add / Edit Category Modal */}
      <Dialog
        open={isAddOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingCategory(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingCategory ? "Edit Category" : `Add ${activeType === "EXPENSE" ? "Expense" : "Income"} Category`}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="catName" className="text-xs">Category Name</Label>
              <Input
                id="catName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Subscriptions, Side Hustle"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Theme Color</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      color === c ? "scale-125 ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddOpen(false)
                  setEditingCategory(null)
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
                {isSubmitting ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
