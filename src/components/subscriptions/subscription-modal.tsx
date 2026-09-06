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
import { Loader2, Sparkles, Bot, Tv, Cloud, Briefcase, Gamepad2, Heart, Tag } from "lucide-react"
import { toast } from "sonner"
import {
  POPULAR_SUBSCRIPTION_PRESETS,
  SUBSCRIPTION_SUBCATEGORIES,
  SubscriptionPreset,
} from "@/lib/subscription-presets"

type SubscriptionFormValues = z.infer<typeof RecurringTransactionSchema>

interface Category {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
}

interface Account {
  id: string
  name: string
}

export interface SubscriptionData {
  id: string
  description: string
  amount: number
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
  categoryId: string
  accountId?: string | null
  startDate: string | Date
  nextRunDate: string | Date
  endDate?: string | Date | null
  isActive: boolean
  isSubscription: boolean
  subcategory?: string | null
  paymentMethod?: string | null
  monthlyAmount?: number
  isDue?: boolean
  isExpired?: boolean
  category?: {
    name: string
    color: string
    icon: string
  }
  account?: {
    name: string
  } | null
}

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: SubscriptionData | null
}

export function SubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: SubscriptionModalProps) {
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
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(RecurringTransactionSchema),
    defaultValues: {
      type: "EXPENSE",
      description: "",
      amount: 15.0,
      frequency: "MONTHLY",
      categoryId: "",
      accountId: "",
      startDate: today,
      endDate: "",
      paymentMethod: "CREDIT_CARD",
      isSubscription: true,
      subcategory: "AI",
    },
  })

  const currentSubcategory = watch("subcategory") || "AI"
  const currentFrequency = watch("frequency")
  const currentAccountId = watch("accountId")

  // Fetch categories and accounts
  React.useEffect(() => {
    if (!isOpen) return
    setIsLoadingMetadata(true)
    Promise.all([
      fetch("/api/categories?type=EXPENSE").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ])
      .then(([cats, accs]) => {
        if (Array.isArray(cats)) {
          setCategories(cats)
          // Default to a Subscriptions category or first expense category
          if (!isEditing) {
            const subCat = cats.find((c) => c.name.toLowerCase().includes("subscription"))
            if (subCat) {
              setValue("categoryId", subCat.id)
            } else if (cats.length > 0) {
              setValue("categoryId", cats[0].id)
            }
          }
        }
        if (Array.isArray(accs)) setAccounts(accs)
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingMetadata(false))
  }, [isOpen, isEditing, setValue])

  // Populate initial data when editing
  React.useEffect(() => {
    if (initialData && isOpen) {
      const formattedStartDate = initialData.startDate
        ? new Date(initialData.startDate).toISOString().split("T")[0]
        : today
      const formattedEndDate = initialData.endDate
        ? new Date(initialData.endDate).toISOString().split("T")[0]
        : ""

      reset({
        type: "EXPENSE",
        description: initialData.description,
        amount: initialData.amount,
        frequency: initialData.frequency,
        categoryId: initialData.categoryId,
        accountId: initialData.accountId || "",
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        paymentMethod: initialData.paymentMethod || "CREDIT_CARD",
        isSubscription: true,
        subcategory: initialData.subcategory || "Other",
      })
    } else if (!initialData && isOpen) {
      reset({
        type: "EXPENSE",
        description: "",
        amount: 15.0,
        frequency: "MONTHLY",
        categoryId: "",
        accountId: "",
        startDate: today,
        endDate: "",
        paymentMethod: "CREDIT_CARD",
        isSubscription: true,
        subcategory: "AI",
      })
    }
  }, [initialData, isOpen, reset, today])

  const applyPreset = (preset: SubscriptionPreset) => {
    setValue("description", preset.name)
    setValue("amount", preset.defaultAmount)
    setValue("frequency", preset.frequency)
    setValue("subcategory", preset.subcategory)
    toast.info(`Filled preset: ${preset.name}`)
  }

  const onSubmit = async (data: SubscriptionFormValues) => {
    setIsSubmitting(true)
    try {
      let finalCategoryId = data.categoryId
      if (!finalCategoryId) {
        const subCat = categories.find((c) => c.name.toLowerCase().includes("subscription"))
        finalCategoryId = subCat ? subCat.id : (categories[0]?.id || "")
      }

      const payload = {
        ...data,
        categoryId: finalCategoryId,
        accountId: data.accountId || null,
        endDate: data.endDate ? data.endDate : null,
        isSubscription: true,
        subcategory: data.subcategory || "Other",
      }

      const url = isEditing
        ? `/api/recurring-transactions/${initialData.id}`
        : "/api/recurring-transactions"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || "Failed to save subscription")
      }

      toast.success(
        isEditing
          ? `Updated "${data.description}" subscription`
          : `Added "${data.description}" to subscriptions`
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="h-5 w-5" />
            <DialogTitle className="text-xl">
              {isEditing ? "Edit Subscription" : "Add New Subscription"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Track recurring digital services, cloud tools, AI models, and media platforms.
          </DialogDescription>
        </DialogHeader>

        {!isEditing && (
          <div className="space-y-2 pt-1 pb-2 border-b border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SUBSCRIPTION_PRESETS.slice(0, 8).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted/60 hover:bg-primary/15 hover:text-primary transition-all border border-border/50 text-foreground"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: preset.color }}
                  />
                  {preset.name}
                  <span className="text-[10px] text-muted-foreground">
                    ${preset.defaultAmount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Subcategory Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Subcategory</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {SUBSCRIPTION_SUBCATEGORIES.map((sub) => {
                const isSelected = currentSubcategory === sub.id
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setValue("subcategory", sub.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                        : "border-border/60 bg-card hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="truncate">{sub.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Service Name */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">
              Service Name / Provider
            </Label>
            <Input
              id="description"
              placeholder="e.g. ChatGPT Plus, Spotify, YouTube Premium"
              {...register("description")}
              className="h-9 text-xs"
            />
            {errors.description && (
              <p className="text-[11px] text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Amount & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs">
                Billing Cost ($)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="20.00"
                {...register("amount")}
                className="h-9 text-xs font-semibold"
              />
              {errors.amount && (
                <p className="text-[11px] text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="frequency" className="text-xs">
                Billing Cycle
              </Label>
              <Select
                value={currentFrequency}
                onValueChange={(val: any) => setValue("frequency", val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly / Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Account */}
          <div className="space-y-1.5">
            <Label htmlFor="account" className="text-xs">
              Linked Payment Account (Optional)
            </Label>
            <Select
              value={currentAccountId || "none"}
              onValueChange={(val) => setValue("accountId", val === "none" ? "" : val)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None / Unassigned</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Renewal / Start Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs">
                Next Renewal Date
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className="h-9 text-xs"
              />
              {errors.startDate && (
                <p className="text-[11px] text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs">
                Trial / Expiration Date (Optional)
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isLoadingMetadata}
              className="text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Add Subscription"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
