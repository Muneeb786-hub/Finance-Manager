"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { useCurrency } from "@/lib/currency-context"
import {
  Landmark,
  Plus,
  Coins,
  Gem,
  CircleDollarSign,
  Building2,
  TrendingUp,
  Wallet,
  Edit2,
  Trash2,
  Loader2,
  Sparkles,
  Tag,
} from "lucide-react"
import { toast } from "sonner"

interface Asset {
  id: string
  name: string
  category: string
  value: number
  quantity?: number | null
  unit?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

interface CategoryBreakdown {
  category: string
  total: number
  count: number
  percent: number
}

// Helper to choose dynamic colors/icons based on category name
function getCategoryMeta(categoryName: string) {
  const lower = (categoryName || "").toLowerCase()
  if (lower.includes("gold")) {
    return { icon: Coins, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" }
  }
  if (lower.includes("silver")) {
    return { icon: Gem, color: "text-slate-400 dark:text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/30" }
  }
  if (lower.includes("cash") || lower.includes("liquid") || lower.includes("wallet")) {
    return { icon: CircleDollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" }
  }
  if (lower.includes("bank") || lower.includes("checking") || lower.includes("saving")) {
    return { icon: Landmark, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" }
  }
  if (lower.includes("real estate") || lower.includes("plot") || lower.includes("house") || lower.includes("property")) {
    return { icon: Building2, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" }
  }
  if (lower.includes("crypto") || lower.includes("stock") || lower.includes("invest") || lower.includes("fund")) {
    return { icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" }
  }
  return { icon: Wallet, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" }
}

const QUICK_CATEGORY_SUGGESTIONS = [
  "Cash",
  "Bank",
  "Gold",
  "Silver",
  "Real Estate",
  "Crypto",
  "Vehicles",
  "Stocks / Investments",
]

export default function AssetsPage() {
  const { format } = useCurrency()
  const [data, setData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeFilter, setActiveFilter] = React.useState<string>("ALL")

  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingAsset, setEditingAsset] = React.useState<Asset | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Asset | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form states
  const [formData, setFormData] = React.useState({
    name: "",
    category: "",
    value: "",
    quantity: "",
    unit: "",
    notes: "",
  })

  const fetchAssets = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/assets")
      if (!res.ok) throw new Error("Failed to load assets")
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      toast.error("Failed to load assets")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const assets: Asset[] = data?.assets || []
  const categoryBreakdown: CategoryBreakdown[] = data?.summary?.categoryBreakdown || []
  const totalNetWorth = data?.summary?.totalNetWorth || 0

  // Existing user categories for quick selection
  const userExistingCategories = Array.from(new Set(assets.map((a) => a.category).filter(Boolean)))

  const handleOpenAdd = (prefillCategory?: string) => {
    setEditingAsset(null)
    setFormData({
      name: "",
      category: prefillCategory || "",
      value: "",
      quantity: "",
      unit: prefillCategory?.toLowerCase().includes("gold") || prefillCategory?.toLowerCase().includes("silver") ? "tola" : "",
      notes: "",
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setFormData({
      name: asset.name,
      category: asset.category,
      value: asset.value.toString(),
      quantity: asset.quantity ? asset.quantity.toString() : "",
      unit: asset.unit || "",
      notes: asset.notes || "",
    })
    setIsModalOpen(true)
  }

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error("Asset name is required")
      return
    }
    if (!formData.category.trim()) {
      toast.error("Category is required (e.g. Gold, Silver, Cash, Bank, etc.)")
      return
    }
    const val = parseFloat(formData.value)
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid valuation amount")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        value: val,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        unit: formData.unit.trim() || null,
        notes: formData.notes.trim() || null,
      }

      if (editingAsset) {
        const res = await fetch(`/api/assets/${editingAsset.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update asset")
        toast.success("Asset updated successfully")
      } else {
        const res = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to add asset")
        toast.success("Asset added successfully")
      }

      setIsModalOpen(false)
      fetchAssets()
    } catch (err: any) {
      toast.error(err.message || "Failed to save asset")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAsset = async () => {
    if (!deleteTarget) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/assets/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete asset")
      toast.success("Asset removed successfully")
      setDeleteTarget(null)
      fetchAssets()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete asset")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredAssets = assets.filter((a) => {
    if (activeFilter === "ALL") return true
    return a.category.toLowerCase() === activeFilter.toLowerCase()
  })

  // Combined suggestions: User's existing categories first, then defaults
  const allCategorySuggestions = Array.from(
    new Set([...userExistingCategories, ...QUICK_CATEGORY_SUGGESTIONS])
  )

  return (
    <div className="space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Landmark className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Total Net Worth & Assets
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track and manage all your assets and valuables. You can define any category yourself.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => handleOpenAdd()} size="sm" className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Hero Net Worth Card */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Consolidated Net Worth
            </span>
            <div className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {isLoading ? "..." : format(totalNetWorth)}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Calculated across {assets.length} custom asset holdings
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => handleOpenAdd()}
              size="sm"
              className="gap-1.5 shadow-sm text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              + Add Any Asset
            </Button>
          </div>
        </div>

        {/* Dynamic Category Breakdown Cards - Generated purely from user's custom categories */}
        {categoryBreakdown.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/60">
            {categoryBreakdown.map((item) => {
              const meta = getCategoryMeta(item.category)
              const Icon = meta.icon
              return (
                <div
                  key={item.category}
                  onClick={() => setActiveFilter(item.category)}
                  className="p-3 rounded-xl border border-border/70 bg-card/60 hover:border-primary/50 cursor-pointer transition-all space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium truncate flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${meta.color} shrink-0`} />
                      {item.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {item.count} item{item.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="text-base font-bold text-foreground">
                    {format(item.total)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {item.percent}% of total net worth
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dynamic Filter Tabs */}
      {categoryBreakdown.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All Assets ({assets.length})
          </button>
          {categoryBreakdown.map((c) => (
            <button
              key={c.category}
              onClick={() => setActiveFilter(c.category)}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeFilter.toLowerCase() === c.category.toLowerCase()
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.category} ({c.count})
            </button>
          ))}
        </div>
      )}

      {/* Assets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/80 shadow-sm animate-pulse">
              <CardContent className="p-5 space-y-3">
                <div className="h-5 bg-muted rounded w-1/2" />
                <div className="h-7 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <Card className="border-border/80 shadow-sm border-dashed">
          <CardContent className="py-14 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {activeFilter === "ALL" ? "No assets added yet" : `No assets found in "${activeFilter}"`}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1 mb-5">
              Add your assets with whatever custom category you want (e.g. Gold, Silver, Cash, Bank, Real Estate, Crypto, etc.).
            </p>
            <Button onClick={() => handleOpenAdd(activeFilter !== "ALL" ? activeFilter : undefined)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const meta = getCategoryMeta(asset.category)
            const Icon = meta.icon
            return (
              <Card
                key={asset.id}
                className="border-border/80 shadow-sm hover:border-primary/40 transition-all hover:shadow-md relative group"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${meta.bg} ${meta.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{asset.name}</h4>
                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                          <Tag className="h-3 w-3 inline" />
                          {asset.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(asset)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit Asset"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(asset)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete Asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                      {format(asset.value)}
                    </div>
                    {asset.quantity && (
                      <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                        Holding: {asset.quantity} {asset.unit || "units"}
                      </div>
                    )}
                    {asset.notes && (
                      <p className="text-[11px] text-muted-foreground/80 mt-1 italic line-clamp-1">
                        &quot;{asset.notes}&quot;
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add / Edit Asset Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Edit Asset" : "Add Asset to Net Worth"}</DialogTitle>
            <DialogDescription>
              Enter any asset details. You can type any category yourself (e.g. Gold, Silver, Cash, Bank, Real Estate, etc.).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAsset} className="space-y-4 py-2">
            {/* Category - Free User Input */}
            <div className="space-y-1.5">
              <Label htmlFor="category">Category (Type your own category)</Label>
              <Input
                id="category"
                placeholder="e.g. Gold, Silver, Cash, Bank, Real Estate, Crypto, Car..."
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                required
                autoFocus
              />

              {/* Quick suggestions pills */}
              <div className="pt-1">
                <span className="text-[10px] text-muted-foreground font-medium">Or pick a suggestion:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {allCategorySuggestions.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
                      className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                        formData.category.toLowerCase() === cat.toLowerCase()
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Asset Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Asset Name / Description</Label>
              <Input
                id="name"
                placeholder="e.g. 24K Gold Bars, Meezan Bank Savings, Plot in Bahria..."
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            {/* Total Valuation ($) */}
            <div className="space-y-1.5">
              <Label htmlFor="value">Total Value ($ / Currency)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 5000.00"
                value={formData.value}
                onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                required
              />
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity (Optional)</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 5"
                  value={formData.quantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">Unit (Optional)</Label>
                <Input
                  id="unit"
                  placeholder="e.g. tola, grams, oz, coins"
                  value={formData.unit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="e.g. Stored in safe, locker #42, etc."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAsset ? "Save Changes" : "Add Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{deleteTarget?.name}&quot;? This will remove it
              from your total net worth calculation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAsset}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
