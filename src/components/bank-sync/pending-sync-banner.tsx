"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BellRing,
  CreditCard,
  Smartphone,
  Building2,
  Check,
  X,
  Loader2,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"

export interface PendingSyncItem {
  id: string
  merchant: string
  amount: number
  currency: string
  channel: "EASYPAISA" | "JAZZCASH" | "CARD" | "BANK"
  suggestedCategoryId?: string | null
  createdAt: string
  suggestedCategory?: {
    id: string
    name: string
    color: string
  } | null
  account?: {
    id: string
    name: string
  } | null
}

interface PendingSyncBannerProps {
  onTransactionApproved?: () => void
}

export function PendingSyncBanner({ onTransactionApproved }: PendingSyncBannerProps) {
  const [items, setItems] = React.useState<PendingSyncItem[]>([])
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [processingId, setProcessingId] = React.useState<string | null>(null)
  const [repeatMonthlyMap, setRepeatMonthlyMap] = React.useState<Record<string, boolean>>({})

  // Inline editing state
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editMerchant, setEditMerchant] = React.useState("")
  const [editAmount, setEditAmount] = React.useState("")
  const [editCategoryId, setEditCategoryId] = React.useState("")

  const fetchPending = React.useCallback(async () => {
    try {
      const res = await fetch("/api/bank-sync")
      if (res.ok) {
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch expense categories
  React.useEffect(() => {
    fetch("/api/categories?type=EXPENSE")
      .then((r) => r.json())
      .then((cats) => {
        if (Array.isArray(cats)) setCategories(cats)
      })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    fetchPending()
    const interval = setInterval(fetchPending, 10000)
    const handleSyncEvent = () => fetchPending()
    window.addEventListener("bank-sync-updated", handleSyncEvent)

    return () => {
      clearInterval(interval)
      window.removeEventListener("bank-sync-updated", handleSyncEvent)
    }
  }, [fetchPending])

  const startEditing = (item: PendingSyncItem) => {
    setEditingId(item.id)
    setEditMerchant(item.merchant)
    setEditAmount(item.amount.toString())
    setEditCategoryId(item.suggestedCategoryId || (categories[0]?.id || ""))
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditMerchant("")
    setEditAmount("")
    setEditCategoryId("")
  }

  const handleApprove = async (item: PendingSyncItem) => {
    setProcessingId(item.id)
    try {
      const isRecurring = !!repeatMonthlyMap[item.id]
      const isCurrentlyEditing = editingId === item.id

      const payload: any = { isRecurring }
      if (isCurrentlyEditing) {
        if (editMerchant.trim()) payload.merchant = editMerchant.trim()
        if (editAmount && parseFloat(editAmount) > 0) payload.amount = parseFloat(editAmount)
        if (editCategoryId) payload.categoryId = editCategoryId
      }

      const res = await fetch(`/api/bank-sync/${item.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to approve transaction")
      }

      const displayMerchant = isCurrentlyEditing ? editMerchant : item.merchant
      const displayAmount = isCurrentlyEditing ? parseFloat(editAmount) : item.amount

      toast.success(
        isRecurring
          ? `Added Rs. ${displayAmount.toLocaleString()} for ${displayMerchant} & scheduled monthly!`
          : `Recorded Rs. ${displayAmount.toLocaleString()} for ${displayMerchant} in expenses!`
      )

      setItems((prev) => prev.filter((i) => i.id !== item.id))
      setEditingId(null)
      if (onTransactionApproved) onTransactionApproved()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setProcessingId(null)
    }
  }

  const handleDismiss = async (item: PendingSyncItem) => {
    setProcessingId(item.id)
    try {
      const res = await fetch(`/api/bank-sync/${item.id}/dismiss`, {
        method: "POST",
      })

      if (!res.ok) throw new Error("Failed to dismiss")

      toast.info(`Dismissed ${item.merchant} charge`)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      if (editingId === item.id) cancelEditing()
    } catch (err: any) {
      toast.error(err.message || "Could not dismiss")
    } finally {
      setProcessingId(null)
    }
  }

  if (isLoading || items.length === 0) {
    return null
  }

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case "EASYPAISA":
        return {
          label: "Easypaisa",
          icon: <Smartphone className="h-3.5 w-3.5" />,
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        }
      case "JAZZCASH":
        return {
          label: "JazzCash",
          icon: <Smartphone className="h-3.5 w-3.5" />,
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        }
      case "BANK":
        return {
          label: "Bank Account",
          icon: <Building2 className="h-3.5 w-3.5" />,
          color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        }
      default:
        return {
          label: "Credit/Debit Card",
          icon: <CreditCard className="h-3.5 w-3.5" />,
          color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        }
    }
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const badge = getChannelBadge(item.channel)
        const isProcessing = processingId === item.id
        const isRepeatChecked = !!repeatMonthlyMap[item.id]
        const isEditingThis = editingId === item.id

        return (
          <div
            key={item.id}
            className="rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10 p-4 shadow-sm transition-all animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left: Info or Edit Form */}
              <div className="flex items-start gap-3 flex-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <BellRing className="h-5 w-5 animate-pulse" />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badge.color}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      New Charge Detected
                    </span>
                  </div>

                  {isEditingThis ? (
                    /* Inline Edit Mode */
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 max-w-lg">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium">Merchant</span>
                        <Input
                          value={editMerchant}
                          onChange={(e) => setEditMerchant(e.target.value)}
                          className="h-8 text-xs font-medium"
                          placeholder="Merchant"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium">Amount (Rs.)</span>
                        <Input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="h-8 text-xs font-semibold"
                          placeholder="Amount"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium">Category</span>
                        <select
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    /* Normal View Mode */
                    <>
                      <p className="text-sm font-bold text-foreground">
                        Rs. {item.amount.toLocaleString()} at{" "}
                        <span className="text-primary underline decoration-primary/30 underline-offset-2">
                          {item.merchant}
                        </span>
                      </p>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {item.suggestedCategory && (
                          <span className="flex items-center gap-1 text-[11px]">
                            Category:
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: item.suggestedCategory.color }}
                            />
                            <span className="font-semibold text-foreground">
                              {item.suggestedCategory.name}
                            </span>
                          </span>
                        )}
                        {item.account && (
                          <span className="text-[11px] text-muted-foreground">
                            • Account: {item.account.name}
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Repeat monthly checkbox */}
                  <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={isRepeatChecked}
                      onChange={(e) =>
                        setRepeatMonthlyMap((prev) => ({
                          ...prev,
                          [item.id]: e.target.checked,
                        }))
                      }
                      className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>Repeat monthly (Subscription)</span>
                  </label>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {isEditingThis ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEditing}
                      disabled={isProcessing}
                      className="h-8 text-xs text-muted-foreground"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item)}
                      disabled={isProcessing}
                      className="h-8 text-xs font-semibold shadow-xs"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5" /> Save & Add
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(item)}
                      disabled={isProcessing}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      title="Edit transaction before adding"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismiss(item)}
                      disabled={isProcessing}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30"
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Dismiss
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item)}
                      disabled={isProcessing}
                      className="h-8 text-xs font-semibold shadow-xs"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5" /> Add to Expenses
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
