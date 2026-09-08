"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import {
  Wallet,
  Plus,
  Landmark,
  Coins,
  Gem,
  Building2,
  TrendingUp,
  CircleDollarSign,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

interface Asset {
  id: string
  name: string
  category: "CASH" | "BANK" | "GOLD" | "SILVER" | "CRYPTO" | "REAL_ESTATE" | "INVESTMENT" | "OTHER"
  value: number
  quantity?: number | null
  unit?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

const CATEGORY_CONFIG = {
  CASH: { label: "Cash & Liquid", icon: CircleDollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  BANK: { label: "Bank Account", icon: Landmark, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  GOLD: { label: "Physical Gold", icon: Coins, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  SILVER: { label: "Physical Silver", icon: Gem, color: "text-slate-400 dark:text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  CRYPTO: { label: "Crypto Asset", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  REAL_ESTATE: { label: "Real Estate", icon: Building2, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  INVESTMENT: { label: "Investment / Stocks", icon: TrendingUp, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  OTHER: { label: "Other Asset", icon: Wallet, color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" },
}

export default function AssetsPage() {
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
    category: "GOLD" as Asset["category"],
    value: "",
    quantity: "",
    unit: "tola",
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

  const handleOpenAdd = (defaultCategory?: Asset["category"]) => {
    setEditingAsset(null)
    setFormData({
      name: "",
      category: defaultCategory || "GOLD",
      value: "",
      quantity: "",
      unit: defaultCategory === "GOLD" || defaultCategory === "SILVER" ? "tola" : "",
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
    const val = parseFloat(formData.value)
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid valuation amount")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
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

  const summary = data?.summary || {
    totalNetWorth: 0,
    cashTotal: 0,
    bankTotal: 0,
    goldTotal: 0,
    silverTotal: 0,
    cryptoTotal: 0,
    otherTotal: 0,
    categoryBreakdown: [],
  }

  const assets: Asset[] = data?.assets || []

  const filteredAssets = assets.filter((a) => {
    if (activeFilter === "ALL") return true
    if (activeFilter === "PRECIOUS_METALS") return a.category === "GOLD" || a.category === "SILVER"
    if (activeFilter === "LIQUID") return a.category === "CASH" || a.category === "BANK"
    return a.category === activeFilter
  })

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
            Track and manage your physical gold, silver, bank accounts, liquid cash, and investments.
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
              {isLoading ? "..." : formatCurrency(summary.totalNetWorth)}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Calculated across {assets.length} active holdings & registered accounts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAdd("GOLD")}
              className="gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs"
            >
              <Coins className="h-3.5 w-3.5" />
              + Add Gold
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAdd("SILVER")}
              className="gap-1.5 border-slate-500/30 text-slate-600 dark:text-slate-300 hover:bg-slate-500/10 text-xs"
            >
              <Gem className="h-3.5 w-3.5" />
              + Add Silver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAdd("CASH")}
              className="gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs"
            >
              <CircleDollarSign className="h-3.5 w-3.5" />
              + Add Cash
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAdd("BANK")}
              className="gap-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 text-xs"
            >
              <Landmark className="h-3.5 w-3.5" />
              + Add Bank
            </Button>
          </div>
        </div>

        {/* Category breakdown pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/60">
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Coins className="h-3 w-3 text-amber-500" /> Physical Gold
            </span>
            <div className="text-base sm:text-lg font-bold text-foreground">
              {formatCurrency(summary.goldTotal)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Gem className="h-3 w-3 text-slate-400" /> Physical Silver
            </span>
            <div className="text-base sm:text-lg font-bold text-foreground">
              {formatCurrency(summary.silverTotal)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Landmark className="h-3 w-3 text-blue-500" /> Bank Balances
            </span>
            <div className="text-base sm:text-lg font-bold text-foreground">
              {formatCurrency(summary.bankTotal)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <CircleDollarSign className="h-3 w-3 text-emerald-500" /> Cash & Liquid
            </span>
            <div className="text-base sm:text-lg font-bold text-foreground">
              {formatCurrency(summary.cashTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: "ALL", label: "All Assets" },
          { id: "PRECIOUS_METALS", label: "Gold & Silver" },
          { id: "LIQUID", label: "Cash & Bank" },
          { id: "CRYPTO", label: "Crypto" },
          { id: "OTHER", label: "Other" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
              <Coins className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No assets found in this view</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1 mb-5">
              Add your gold holdings, silver bars, bank accounts, or cash to track your complete portfolio.
            </p>
            <Button onClick={() => handleOpenAdd()} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const config = CATEGORY_CONFIG[asset.category] || CATEGORY_CONFIG.OTHER
            const Icon = config.icon
            return (
              <Card
                key={asset.id}
                className="border-border/80 shadow-sm hover:border-primary/40 transition-all hover:shadow-md relative group"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${config.bg} ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{asset.name}</h4>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {config.label}
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
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {formatCurrency(asset.value)}
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
              Record your gold, silver, bank accounts, liquid cash, or other valuables.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAsset} className="space-y-4 py-2">
            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category">Asset Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val: any) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: val,
                    unit: val === "GOLD" || val === "SILVER" ? "tola" : prev.unit,
                  }))
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOLD">Physical Gold (Coins, Bars, Jewelry)</SelectItem>
                  <SelectItem value="SILVER">Physical Silver (Bars, Coins)</SelectItem>
                  <SelectItem value="CASH">Cash & Liquid (In hand, Safe)</SelectItem>
                  <SelectItem value="BANK">Bank Account (Checking, Savings)</SelectItem>
                  <SelectItem value="CRYPTO">Crypto (Bitcoin, Ethereum, etc.)</SelectItem>
                  <SelectItem value="REAL_ESTATE">Real Estate / Property</SelectItem>
                  <SelectItem value="INVESTMENT">Investment / Stocks</SelectItem>
                  <SelectItem value="OTHER">Other Valuables</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Asset Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Asset Name</Label>
              <Input
                id="name"
                placeholder={
                  formData.category === "GOLD"
                    ? "e.g. 24K Gold Bar or 10 Tolas Coins"
                    : formData.category === "SILVER"
                    ? "e.g. 500g Silver Bullion"
                    : formData.category === "BANK"
                    ? "e.g. Meezan Bank / HBL Account"
                    : "e.g. Emergency Cash Vault"
                }
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
                placeholder="5000.00"
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
                  placeholder="e.g. tola, grams, oz"
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
                placeholder="e.g. Stored in bank safe deposit box"
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
