"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Loader2, PlusCircle, MinusCircle } from "lucide-react"
import { toast } from "sonner"
import { GoalData } from "./goal-card"
import { formatCurrency } from "@/lib/utils"

const FormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["CONTRIBUTION", "WITHDRAWAL"]),
  note: z.string().optional(),
  date: z.string().min(1, "Date is required"),
})

type FormValues = z.infer<typeof FormSchema>

interface ContributionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  goal: GoalData | null
  defaultType?: "CONTRIBUTION" | "WITHDRAWAL"
}

export function ContributionModal({
  isOpen,
  onClose,
  onSuccess,
  goal,
  defaultType = "CONTRIBUTION",
}: ContributionModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const today = new Date().toISOString().split("T")[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: 100,
      type: defaultType,
      date: today,
      note: "",
    },
  })

  const currentType = watch("type")

  React.useEffect(() => {
    if (isOpen) {
      reset({
        amount: 100,
        type: defaultType,
        date: today,
        note: "",
      })
    }
  }, [isOpen, defaultType, today, reset])

  const onSubmit = async (values: FormValues) => {
    if (!goal) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/goals/${goal.id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to record transaction")

      if (data.milestoneAchieved) {
        toast.success(`Milestone reached! You completed your "${goal.title}" goal! 🎉`)
      } else {
        toast.success(
          values.type === "CONTRIBUTION"
            ? `Deposited ${formatCurrency(values.amount)} toward ${goal.title}`
            : `Withdrew ${formatCurrency(values.amount)} from ${goal.title}`
        )
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
          <DialogTitle>
            {currentType === "CONTRIBUTION" ? "Deposit to Goal" : "Withdraw from Goal"}
          </DialogTitle>
          <DialogDescription>
            {goal?.title}: Current balance is{" "}
            <span className="font-semibold text-foreground">
              {goal ? formatCurrency(goal.currentAmount) : "$0.00"}
            </span>{" "}
            of {goal ? formatCurrency(goal.targetAmount) : "$0.00"}.
          </DialogDescription>
        </DialogHeader>

        {/* Type Switcher Buttons */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setValue("type", "CONTRIBUTION")}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              currentType === "CONTRIBUTION"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5 text-emerald-500" />
            Deposit
          </button>
          <button
            type="button"
            onClick={() => setValue("type", "WITHDRAWAL")}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              currentType === "WITHDRAWAL"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MinusCircle className="h-3.5 w-3.5 text-rose-500" />
            Withdraw
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="100.00"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (Optional)</Label>
            <Input
              id="note"
              placeholder="e.g. Birthday gift, monthly allocation"
              {...register("note")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentType === "CONTRIBUTION" ? "Confirm Deposit" : "Confirm Withdrawal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
