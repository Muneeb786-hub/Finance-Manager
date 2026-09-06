"use client"

import * as React from "react"
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
import {
  Smartphone,
  CreditCard,
  Building2,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Plus,
  Loader2,
  Info,
} from "lucide-react"
import { toast } from "sonner"

export interface ProviderOption {
  id: string
  name: string
  type: "DIGITAL_WALLET" | "BANK_ACCOUNT" | "CREDIT_CARD"
  defaultSenderId?: string
  identifierPlaceholder: string
  identifierLabel: string
  badgeColor: string
}

export const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    id: "EASYPAISA",
    name: "Easypaisa",
    type: "DIGITAL_WALLET",
    defaultSenderId: "3737",
    identifierLabel: "Easypaisa Mobile Number",
    identifierPlaceholder: "0300-1234567",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  },
  {
    id: "JAZZCASH",
    name: "JazzCash",
    type: "DIGITAL_WALLET",
    defaultSenderId: "8558",
    identifierLabel: "JazzCash Mobile Number",
    identifierPlaceholder: "0301-1234567",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
  {
    id: "MEEZAN_BANK",
    name: "Meezan Bank",
    type: "BANK_ACCOUNT",
    defaultSenderId: "MeezanBank",
    identifierLabel: "Card Last 4 Digits or Account #",
    identifierPlaceholder: "e.g. 4242",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  {
    id: "HBL",
    name: "HBL Bank",
    type: "BANK_ACCOUNT",
    defaultSenderId: "HBL",
    identifierLabel: "Card Last 4 Digits or Account #",
    identifierPlaceholder: "e.g. 9876",
    badgeColor: "bg-teal-500/10 text-teal-600 border-teal-500/30",
  },
  {
    id: "SADAPAY",
    name: "SadaPay",
    type: "CREDIT_CARD",
    defaultSenderId: "SadaPay",
    identifierLabel: "Card Last 4 Digits",
    identifierPlaceholder: "e.g. 1122",
    badgeColor: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  },
  {
    id: "NAYAPAY",
    name: "NayaPay",
    type: "DIGITAL_WALLET",
    defaultSenderId: "NayaPay",
    identifierLabel: "Mobile Number or Card Digits",
    identifierPlaceholder: "0300-1234567 or 3344",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  },
  {
    id: "CARD",
    name: "Credit / Debit Card (Visa/Mastercard)",
    type: "CREDIT_CARD",
    identifierLabel: "Card Last 4 Digits",
    identifierPlaceholder: "e.g. 4242",
    badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
  },
]

interface LinkWalletModalProps {
  isOpen: boolean
  onClose: () => void
  onAccountLinked?: () => void
  existingLedgerAccounts?: { id: string; name: string }[]
}

export function LinkWalletModal({
  isOpen,
  onClose,
  onAccountLinked,
  existingLedgerAccounts = [],
}: LinkWalletModalProps) {
  const [selectedProviderId, setSelectedProviderId] = React.useState("EASYPAISA")
  const [accountName, setAccountName] = React.useState("")
  const [identifier, setIdentifier] = React.useState("")
  const [selectedAccountId, setSelectedAccountId] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const selectedProvider =
    PROVIDER_OPTIONS.find((p) => p.id === selectedProviderId) || PROVIDER_OPTIONS[0]

  React.useEffect(() => {
    if (isOpen) {
      setAccountName(`${selectedProvider.name}`)
      setIdentifier("")
      setSelectedAccountId("")
    }
  }, [isOpen, selectedProviderId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) {
      toast.error(`Please enter your ${selectedProvider.identifierLabel}`)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/bank-sync/linked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider.id,
          accountName: accountName.trim() || selectedProvider.name,
          identifier: identifier.trim(),
          senderId: selectedProvider.defaultSenderId,
          accountId: selectedAccountId || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to link account")
      }

      toast.success(`${selectedProvider.name} linked successfully!`)
      if (onAccountLinked) onAccountLinked()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to link account")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Smartphone className="h-5 w-5" />
            <DialogTitle className="text-lg">Link Bank or Digital Wallet</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Connect your Easypaisa, JazzCash, Meezan Bank, or card to automatically track spending from bank alerts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Provider Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Select Provider / Bank</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border rounded-lg">
              {PROVIDER_OPTIONS.map((provider) => {
                const isSelected = selectedProviderId === provider.id
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => {
                      setSelectedProviderId(provider.id)
                      setAccountName(provider.name)
                    }}
                    className={`flex items-center gap-2 p-2 rounded-md border text-left transition-all text-xs ${
                      isSelected
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    {provider.type === "DIGITAL_WALLET" ? (
                      <Smartphone className="h-3.5 w-3.5 shrink-0" />
                    ) : provider.type === "BANK_ACCOUNT" ? (
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{provider.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="accountName" className="text-xs font-semibold">
                Account Label / Display Name
              </Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. My Primary Easypaisa"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="identifier" className="text-xs font-semibold">
                  {selectedProvider.identifierLabel}
                </Label>
                {selectedProvider.defaultSenderId && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    SMS Sender: {selectedProvider.defaultSenderId}
                  </span>
                )}
              </div>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={selectedProvider.identifierPlaceholder}
                className="h-9 text-xs font-mono"
                required
              />
              <p className="text-[10px] text-muted-foreground">
                Matches incoming bank alert SMS messages containing this identifier.
              </p>
            </div>

            {existingLedgerAccounts.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="ledgerAccount" className="text-xs font-semibold">
                  Link to Financial Ledger Account (Optional)
                </Label>
                <select
                  id="ledgerAccount"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Auto-create dedicated account</option>
                  {existingLedgerAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-muted/60 p-3 text-[11px] text-muted-foreground space-y-1 border border-border/50">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Zero Credentials Required</span>
            </div>
            <p>
              Your banking PINs or passwords are never asked. Transactions are matched purely from incoming confirmation SMS alerts.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="text-xs font-semibold">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Linking...
                </>
              ) : (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Link Account
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
