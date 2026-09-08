"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { BudgetSchema } from "@/lib/validations"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { Loader2, Plus, Check, Info, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { BudgetData } from "./budget-card"

type BudgetFormValues = z.infer<typeof BudgetSchema>

interface Category {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
  color: string
  icon?: string
}

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: BudgetData | null
  currentMonth: number
  currentYear: number
  existingCategoryIds?: string[]
  allBudgets?: BudgetData[]
}

const PRESET_COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f97316", // Orange
  "#eab308", // Amber
  "#06b6d4", // Cyan
  "#64748b", // Slate
]

export function BudgetModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  currentMonth,
  currentYear,
  existingCategoryIds = [],
  allBudgets = [],
}: BudgetModalProps) {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Inline custom category creation mode
  const [isCreatingCategory, setIsCreatingCategory] = React.useState(false)
  const [newCatName, setNewCatName] = React.useState("")
  const [newCatColor, setNewCatColor] = React.useState(PRESET_COLORS[0])
  const [isSavingCategory, setIsSavingCategory] = React.useState(false)

  const isEditing = !!initialData

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(BudgetSchema),
    defaultValues: {
      categoryId: "",
      amount: 500,
      month: currentMonth,
      year: currentYear,
      alertThreshold: 80,
    },
  })

  // Fetch expense categories
  const fetchCategories = React.useCallback(async () => {
    setIsLoadingCategories(true)
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (Array.isArray(data)) {
        const expenseCats = data.filter((c: any) => c.type === "EXPENSE")
        setCategories(expenseCats)
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err)
    } finally {
      setIsLoadingCategories(false)
    }
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      fetchCategories()
      setIsCreatingCategory(false)
      setNewCatName("")
    }
  }, [isOpen, fetchCategories])

  // Populate form on edit
  React.useEffect(() => {
    if (initialData) {
      reset({
        categoryId: initialData.categoryId,
        amount: initialData.amount,
        month: initialData.month,
        year: initialData.year,
        alertThreshold: initialData.alertThreshold,
      })
    } else {
      reset({
        categoryId: "",
        amount: 500,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 80,
      })
    }
  }, [initialData, currentMonth, currentYear, reset])

  const selectedCategoryId = watch("categoryId")

  // Check if chosen category already has a budget in this month
  const matchingExistingBudget = React.useMemo(() => {
    if (!selectedCategoryId) return null
    return allBudgets.find((b) => b.categoryId === selectedCategoryId) || null
  }, [selectedCategoryId, allBudgets])

  // If a category with existing budget is chosen and not explicitly editing, prefill its current amount
  React.useEffect(() => {
    if (!isEditing && matchingExistingBudget) {
      setValue("amount", matchingExistingBudget.amount)
      setValue("alertThreshold", matchingExistingBudget.alertThreshold)
    }
  }, [matchingExistingBudget, isEditing, setValue])

  const handleCreateCustomCategory = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) {
      toast.error("Please enter a category name")
      return
    }

    setIsSavingCategory(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          type: "EXPENSE",
          color: newCatColor,
          icon: "tag",
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to create category")
      }

      const createdCat = await res.json()
      toast.success(`Category "${createdCat.name}" created!`)

      setCategories((prev) => [...prev, createdCat])
      setValue("categoryId", createdCat.id, { shouldValidate: true })
      setIsCreatingCategory(false)
      setNewCatName("")
    } catch (err: any) {
      toast.error(err.message || "Failed to create category")
    } finally {
      setIsSavingCategory(false)
    }
  }

  const onSubmit = async (values: BudgetFormValues) => {
    setIsSubmitting(true)
    try {
      const targetBudgetId = isEditing
        ? initialData?.id
        : matchingExistingBudget?.id

      if (targetBudgetId) {
        const res = await fetch(`/api/budgets/${targetBudgetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: values.amount,
            alertThreshold: values.alertThreshold,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.message || "Failed to update budget")
        }

        toast.success("Budget limit updated successfully")
      } else {
        const res = await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.message || "Failed to create budget")
        }

        toast.success("Budget created successfully")
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing || matchingExistingBudget ? "Edit Category Budget Limit" : "Set Category Budget"}
          </DialogTitle>
          <DialogDescription>
            {isEditing || matchingExistingBudget
              ? "Update your monthly spending limit or threshold (e.g. change from $800 to $900)."
              : "Define a monthly spending ceiling for an existing category or create a new one."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Category Select or Create Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="category">Expense Category</Label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {isCreatingCategory ? "Select Existing" : "Add Custom Category"}
                </button>
              )}
            </div>

            {/* Inline Custom Category Creator */}
            {isCreatingCategory ? (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Create New Category
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="e.g. Education, Gym, Coffee..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-9 text-xs"
                    autoFocus
                  />
                </div>

                {/* Color Selector */}
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Pick a Color</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCatColor(c)}
                        className={`h-5 w-5 rounded-full transition-transform ${
                          newCatColor === c ? "scale-125 ring-2 ring-primary ring-offset-2" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setIsCreatingCategory(false)}
                    disabled={isSavingCategory}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={handleCreateCustomCategory}
                    disabled={isSavingCategory}
                  >
                    {isSavingCategory && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save & Select
                  </Button>
                </div>
              </div>
            ) : isEditing ? (
              <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 p-2.5 text-sm font-medium">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: initialData?.category?.color || "#10b981" }}
                />
                <span>{initialData?.category?.name}</span>
              </div>
            ) : (
              <Select
                value={selectedCategoryId}
                onValueChange={(val) => setValue("categoryId", val, { shouldValidate: true })}
                disabled={isLoadingCategories}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select category"} />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {categories.map((cat) => {
                    const isBudgeted = allBudgets.some((b) => b.categoryId === cat.id)
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span>{cat.name}</span>
                          {isBudgeted && (
                            <span className="text-[10px] text-muted-foreground ml-1">
                              (Has active budget)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}

            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId.message}</p>
            )}

            {/* If user picked a category that already has a budget, show notification */}
            {!isEditing && matchingExistingBudget && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2.5 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">
                    Current budget: {formatCurrency(matchingExistingBudget.amount)}/mo
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Update the limit below to change your monthly spending target (e.g. from {formatCurrency(matchingExistingBudget.amount)} to $900).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Limit Amount ($) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Monthly Budget Limit ($)</Label>
              {matchingExistingBudget && (
                <span className="text-[11px] text-muted-foreground">
                  Current: {formatCurrency(matchingExistingBudget.amount)}
                </span>
              )}
            </div>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 900.00"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Alert Threshold */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="alertThreshold">Alert Warning Threshold</Label>
              <span className="text-xs text-muted-foreground font-mono">
                {watch("alertThreshold") || 80}%
              </span>
            </div>
            <Input
              id="alertThreshold"
              type="number"
              min="10"
              max="100"
              placeholder="80"
              {...register("alertThreshold")}
            />
            <p className="text-[11px] text-muted-foreground">
              We will flag the budget as &quot;Near Limit&quot; once spending reaches this percentage.
            </p>
            {errors.alertThreshold && (
              <p className="text-xs text-destructive">{errors.alertThreshold.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing || matchingExistingBudget ? "Update Budget Limit" : "Create Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
