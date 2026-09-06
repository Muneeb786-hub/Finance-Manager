"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { RecurringTransactionSchema } from "@/lib/validations"
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
import { Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { toast } from "sonner"
import { RecurringScheduleData } from "./recurring-card"

type RecurringFormValues = z.infer<typeof RecurringTransactionSchema>

interface Category {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
  color: string
}

interface Account {
  id: string
  name: string
}

interface RecurringModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: RecurringScheduleData | null
}

export function RecurringModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: RecurringModalProps) {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [isLoadingMetadata, setIsLoadingMetadata] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const isEditing = !!initialData
  const today = new Date().toISOString().split("T")[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RecurringFormValues>({
    resolver: zodResolver(RecurringTransactionSchema),
    defaultValues: {
      type: "EXPENSE",
      description: "",
      amount: 50,
      frequency: "MONTHLY",
      categoryId: "",
      accountId: "",
      startDate: today,
      endDate: "",
      paymentMethod: "OTHER",
    },
  })

  const currentType = watch("type")
  const currentCategoryId = watch("categoryId")
  const currentAccountId = watch("accountId")
  const currentFrequency = watch("frequency")

  // Load categories and accounts
  React.useEffect(() => {
    if (!isOpen) return
    setIsLoadingMetadata(true)
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ])
      .then(([cats, accs]) => {
        if (Array.isArray(cats)) setCategories(cats)
        if (Array.isArray(accs)) setAccounts(accs)
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingMetadata(false))
  }, [isOpen])

  React.useEffect(() => {
    if (initialData) {
      reset({
        type: initialData.type,
        description: initialData.description,
        amount: initialData.amount,
        frequency: initialData.frequency,
        categoryId: initialData.category.id,
        accountId: initialData.account?.id || "",
        startDate: new Date(initialData.startDate).toISOString().split("T")[0],
        endDate: initialData.endDate
          ? new Date(initialData.endDate).toISOString().split("T")[0]
          : "",
        paymentMethod: initialData.paymentMethod || "OTHER",
      })
    } else {
      reset({
        type: "EXPENSE",
        description: "",
        amount: 50,
        frequency: "MONTHLY",
        categoryId: "",
        accountId: "",
        startDate: today,
        endDate: "",
        paymentMethod: "OTHER",
      })
    }
  }, [initialData, isOpen, today, reset])

  const filteredCategories = categories.filter((c) => c.type === currentType)

  const onSubmit = async (values: RecurringFormValues) => {
    setIsSubmitting(true)
    try {
      if (isEditing && initialData) {
        const res = await fetch(`/api/recurring-transactions/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.message || "Failed to update recurring schedule")
        }

        toast.success("Recurring schedule updated successfully")
      } else {
        const res = await fetch("/api/recurring-transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.message || "Failed to create recurring schedule")
        }

        toast.success("Recurring schedule created successfully")
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Recurring Schedule" : "New Recurring Schedule"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your recurring transaction rules and dates."
              : "Automate recurring income or periodic bills in your cash flow."}
          </DialogDescription>
        </DialogHeader>

        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => {
              setValue("type", "EXPENSE")
              setValue("categoryId", "")
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              currentType === "EXPENSE"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
            Recurring Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setValue("type", "INCOME")
              setValue("categoryId", "")
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              currentType === "INCOME"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
            Recurring Income
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1">
          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder={currentType === "EXPENSE" ? "e.g. Netflix, Rent, Gym" : "e.g. Salary, Scholarship"}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Amount & Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="49.99"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={currentFrequency}
                onValueChange={(val: any) => setValue("frequency", val, { shouldValidate: true })}
              >
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select
                value={currentCategoryId}
                onValueChange={(val) => setValue("categoryId", val, { shouldValidate: true })}
                disabled={isLoadingMetadata}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
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
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account">Account (Optional)</Label>
              <Select
                value={currentAccountId || "NONE"}
                onValueChange={(val) => setValue("accountId", val === "NONE" ? "" : val)}
                disabled={isLoadingMetadata}
              >
                <SelectTrigger id="account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None / Default</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start / First Run Date</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
