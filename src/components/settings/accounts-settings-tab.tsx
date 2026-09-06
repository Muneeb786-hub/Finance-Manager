"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Wallet, Plus, Trash2, Edit2, CreditCard, Building, Smartphone, Banknote } from "lucide-react"
import { LinkedAccountsCard } from "@/components/bank-sync/linked-accounts-card"

export interface AccountRecord {
  id: string
  name: string
  type: "CASH" | "BANK_ACCOUNT" | "DIGITAL_WALLET" | "CREDIT_CARD" | "INVESTMENT" | "OTHER"
  openingBalance: number
  createdAt: string
}

interface AccountsSettingsTabProps {
  accounts: AccountRecord[]
  onRefresh: () => void
}

export function AccountsSettingsTab({ accounts, onRefresh }: AccountsSettingsTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountRecord | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState("")
  const [type, setType] = useState<AccountRecord["type"]>("BANK_ACCOUNT")
  const [openingBalance, setOpeningBalance] = useState("0")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const openAddModal = () => {
    setName("")
    setType("BANK_ACCOUNT")
    setOpeningBalance("0")
    setErrorMsg(null)
    setIsAddOpen(true)
  }

  const openEditModal = (acc: AccountRecord) => {
    setEditingAccount(acc)
    setName(acc.name)
    setType(acc.type)
    setOpeningBalance(acc.openingBalance.toString())
    setErrorMsg(null)
  }

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    const isEdit = !!editingAccount
    const url = isEdit ? `/api/accounts/${editingAccount.id}` : "/api/accounts"
    const method = isEdit ? "PATCH" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          openingBalance: parseFloat(openingBalance) || 0,
        }),
      })

      if (res.ok) {
        setIsAddOpen(false)
        setEditingAccount(null)
        onRefresh()
      } else {
        const data = await res.json()
        setErrorMsg(data.message || "Failed to save account")
      }
    } catch (err) {
      setErrorMsg("A network error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDeletingId(null)
        onRefresh()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getAccountIcon = (accType: AccountRecord["type"]) => {
    switch (accType) {
      case "BANK_ACCOUNT":
        return <Building className="h-4 w-4 text-sky-500" />
      case "CREDIT_CARD":
        return <CreditCard className="h-4 w-4 text-rose-500" />
      case "DIGITAL_WALLET":
        return <Smartphone className="h-4 w-4 text-purple-500" />
      case "CASH":
        return <Banknote className="h-4 w-4 text-emerald-500" />
      default:
        return <Wallet className="h-4 w-4 text-primary" />
    }
  }

  const formatAccountType = (accType: string) => {
    return accType
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="space-y-6">
      <LinkedAccountsCard existingLedgerAccounts={accounts} />

      <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Financial Accounts &amp; Ledgers</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Manage your checking accounts, digital wallets, credit cards, and cash stores
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAddModal} className="h-8 gap-1.5 text-xs shadow-xs self-start sm:self-auto">
            <Plus className="h-3.5 w-3.5" />
            Add Account
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {accounts.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No accounts configured yet. Click &quot;Add Account&quot; to establish your primary checking or cash store.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-xl border border-border bg-card/60 hover:bg-muted/30 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-muted/60 border border-border/50 shrink-0">
                    {getAccountIcon(acc.type)}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{acc.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {formatAccountType(acc.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        Base: ${acc.openingBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(acc)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Edit account"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Delete account"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add / Edit Account Modal */}
      <Dialog
        open={isAddOpen || !!editingAccount}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingAccount(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingAccount ? "Edit Account" : "Add New Account"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveAccount} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="accName" className="text-xs">Account Name</Label>
              <Input
                id="accName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chase Total Checking"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accType" className="text-xs">Account Type</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger id="accType" className="h-9 text-xs">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_ACCOUNT">Bank Account (Checking / Savings)</SelectItem>
                  <SelectItem value="CASH">Cash &amp; Petty Cash</SelectItem>
                  <SelectItem value="DIGITAL_WALLET">Digital Wallet (PayPal, Venmo)</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="INVESTMENT">Investment / Brokerage</SelectItem>
                  <SelectItem value="OTHER">Other Ledger</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="openingBal" className="text-xs">Opening Balance ($)</Label>
              <Input
                id="openingBal"
                type="number"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                required
                className="h-9 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground">
                Initial starting balance when tracking began.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddOpen(false)
                  setEditingAccount(null)
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
                {isSubmitting ? "Saving..." : editingAccount ? "Save Changes" : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
    </div>
  )
}
