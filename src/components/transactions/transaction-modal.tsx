"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { TransactionSchema } from "@/lib/validations"
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

type TransactionFormValues = z.infer<typeof TransactionSchema>

interface Category {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
  color: string
}

interface Account {
  id: string
  name: string
  type: string
}

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: any | null
}

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: TransactionModalProps) {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const isEditing = !!initialData

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(TransactionSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: 0,
      categoryId: "",
      accountId: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      paymentMethod: "OTHER",
      tags: [],
    },
  })

  const selectedType = watch("type")

  // Fetch categories and accounts on mount or open
  React.useEffect(() => {
    if (isOpen) {
      setIsLoadingData(true)
      Promise.all([
        fetch("/api/categories").then((r) => r.json()),
        fetch("/api/accounts").then((r) => r.json()),
      ])
        .then(([cats, accs]) => {
          setCategories(Array.isArray(cats) ? cats : [])
          setAccounts(Array.isArray(accs) ? accs : [])
        })
        .finally(() => setIsLoadingData(false))
    }
  }, [isOpen])

  // Populate form if initialData provided
  React.useEffect(() => {
    if (initialData) {
      reset({
        type: initialData.type,
        amount: initialData.amount,
        categoryId: initialData.categoryId,
        accountId: initialData.accountId || "",
        date: new Date(initialData.date).toISOString().split("T")[0],
        description: initialData.description,
        paymentMethod: initialData.paymentMethod || "OTHER",
        tags: initialData.tags || [],
      })
    } else {
      reset({
        type: "EXPENSE",
        amount: 0,
        categoryId: "",
        accountId: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        paymentMethod: "OTHER",
        tags: [],
      })
    }
  }, [initialData, reset, isOpen])

  const filteredCategories = categories.filter((c) => c.type === selectedType)

  const onSubmit = async (data: TransactionFormValues) => {
    setIsSubmitting(true)
    try {
      const url = isEditing
        ? `/api/transactions/${initialData.id}`
        : "/api/transactions"
      const method = isEditing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to save transaction")
      }

      toast.success(isEditing ? "Transaction updated" : "Transaction created")
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Transaction" : "New Transaction"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update details of this existing record."
              : "Add a new income or expense transaction to your personal ledger."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Transaction Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => {
                setValue("type", "EXPENSE")
                setValue("categoryId", "")
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-all ${
                selectedType === "EXPENSE"
                  ? "bg-rose-600 text-white shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("type", "INCOME")
                setValue("categoryId", "")
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-all ${
                selectedType === "INCOME"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                disabled={isSubmitting}
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                disabled={isSubmitting}
                {...register("date")}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g. Whole Foods groceries, Monthly stipend"
              disabled={isSubmitting}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Category & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isSubmitting || isLoadingData}
                {...register("categoryId")}
              >
                <option value="">Select Category</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accountId">Account (Optional)</Label>
              <select
                id="accountId"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isSubmitting || isLoadingData}
                {...register("accountId")}
              >
                <option value="">None / Cash</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <select
                id="paymentMethod"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isSubmitting}
                {...register("paymentMethod")}
              >
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="DIGITAL_WALLET">Digital Wallet</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tagsInput">Tags (comma separated)</Label>
              <Input
                id="tagsInput"
                placeholder="groceries, essential"
                disabled={isSubmitting}
                defaultValue={initialData?.tags?.join(", ") || ""}
                onChange={(e) => {
                  const tags = e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                  setValue("tags", tags)
                }}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Add Transaction"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
