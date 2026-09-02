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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BudgetData } from "./budget-card"

type BudgetFormValues = z.infer<typeof BudgetSchema>

interface Category {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
  color: string
}

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: BudgetData | null
  currentMonth: number
  currentYear: number
  existingCategoryIds?: string[]
}

export function BudgetModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  currentMonth,
  currentYear,
  existingCategoryIds = [],
}: BudgetModalProps) {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

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
  React.useEffect(() => {
    if (!isOpen) return
    setIsLoadingCategories(true)
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const expenseCats = data.filter((c: any) => c.type === "EXPENSE")
          setCategories(expenseCats)
        }
      })
      .catch((err) => console.error("Failed to fetch categories:", err))
      .finally(() => setIsLoadingCategories(false))
  }, [isOpen])

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

  const onSubmit = async (values: BudgetFormValues) => {
    setIsSubmitting(true)
    try {
      if (isEditing && initialData) {
        const res = await fetch(`/api/budgets/${initialData.id}`, {
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

        toast.success("Budget updated successfully")
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

  // Filter out already budgeted categories if creating new
  const availableCategories = isEditing
    ? categories
    : categories.filter((c) => !existingCategoryIds.includes(c.id))

  const selectedCategoryId = watch("categoryId")

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category Budget" : "Set Category Budget"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your monthly spending limit and alert threshold."
              : "Define a monthly spending ceiling for a specific category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Category Select */}
          <div className="space-y-1.5">
            <Label htmlFor="category">Expense Category</Label>
            {isEditing ? (
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
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {availableCategories.length === 0 && !isLoadingCategories && (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      All available expense categories are already budgeted.
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Monthly Limit Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Monthly Budget Limit ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="500.00"
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
              {isEditing ? "Save Changes" : "Create Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
