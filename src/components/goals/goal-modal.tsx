"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { SavingsGoalSchema } from "@/lib/validations"
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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { GoalData } from "./goal-card"

type GoalFormValues = z.infer<typeof SavingsGoalSchema>

interface GoalModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: GoalData | null
}

const COLOR_OPTIONS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f97316", // Orange
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#eab308", // Yellow
  "#64748b", // Slate
]

export function GoalModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: GoalModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditing = !!initialData

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(SavingsGoalSchema),
    defaultValues: {
      title: "",
      targetAmount: 1000,
      currentAmount: 0,
      targetDate: "",
      icon: "target",
      color: "#3b82f6",
      notes: "",
    },
  })

  const selectedColor = watch("color") || "#3b82f6"

  React.useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        targetAmount: initialData.targetAmount,
        currentAmount: initialData.currentAmount,
        targetDate: initialData.targetDate
          ? new Date(initialData.targetDate).toISOString().split("T")[0]
          : "",
        icon: initialData.icon || "target",
        color: initialData.color || "#3b82f6",
        notes: initialData.notes || "",
      })
    } else {
      reset({
        title: "",
        targetAmount: 1000,
        currentAmount: 0,
        targetDate: "",
        icon: "target",
        color: "#3b82f6",
        notes: "",
      })
    }
  }, [initialData, reset, isOpen])

  const onSubmit = async (values: GoalFormValues) => {
    setIsSubmitting(true)
    try {
      if (isEditing && initialData) {
        const res = await fetch(`/api/goals/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.message || "Failed to update savings goal")
        }

        toast.success("Savings goal updated successfully")
      } else {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.message || "Failed to create savings goal")
        }

        toast.success("Savings goal created successfully")
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Savings Goal" : "Create Savings Goal"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modify your target amount, completion date, or notes."
              : "Define a financial milestone and track your savings pace."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              placeholder="e.g. Emergency Fund, New Car, Vacation"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Amounts row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="targetAmount">Target Amount ($)</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="2500.00"
                {...register("targetAmount")}
              />
              {errors.targetAmount && (
                <p className="text-xs text-destructive">{errors.targetAmount.message}</p>
              )}
            </div>

            {!isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="currentAmount">Starting Amount ($)</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("currentAmount")}
                />
                {errors.currentAmount && (
                  <p className="text-xs text-destructive">{errors.currentAmount.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Target Date */}
          <div className="space-y-1.5">
            <Label htmlFor="targetDate">Target Date (Optional)</Label>
            <Input id="targetDate" type="date" {...register("targetDate")} />
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <Label>Badge Color</Label>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("color", c)}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    selectedColor === c ? "scale-125 ring-2 ring-primary ring-offset-2" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes or Motivation</Label>
            <Input
              id="notes"
              placeholder="e.g. 3 months of basic living expenses buffer"
              {...register("notes")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
