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
import { Zap, Loader2, MessageSquare, Edit3, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { SAMPLE_SMS_TEMPLATES } from "@/lib/merchant-sync"
import { LinkWalletModal } from "./link-wallet-modal"

interface SimulateSyncModalProps {
  isOpen: boolean
  onClose: () => void
  onSyncTriggered?: () => void
}

export function SimulateSyncModal({
  isOpen,
  onClose,
  onSyncTriggered,
}: SimulateSyncModalProps) {
  const [activeTab, setActiveTab] = React.useState<"manual" | "sms">("manual")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = React.useState(false)

  // Fully editable fields
  const [merchant, setMerchant] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [channel, setChannel] = React.useState<"CARD" | "EASYPAISA" | "JAZZCASH" | "BANK">("CARD")
  const [smsText, setSmsText] = React.useState("")

  React.useEffect(() => {
    if (isOpen) {
      setMerchant("")
      setAmount("")
      setChannel("CARD")
      setSmsText("")
      setActiveTab("manual")
    }
  }, [isOpen])

  const triggerSync = async (payload: any) => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/bank-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to simulate transaction")
      }

      toast.success(
        `Card charge simulated for ${payload.merchant || "transaction"}! Check the confirmation prompt above.`
      )

      window.dispatchEvent(new CustomEvent("bank-sync-updated"))
      if (onSyncTriggered) onSyncTriggered()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Simulation failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!merchant.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid merchant name and positive amount")
      return
    }

    triggerSync({
      merchant: merchant.trim(),
      amount: parseFloat(amount),
      channel,
    })
  }

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!smsText.trim()) {
      toast.error("Please enter bank SMS text")
      return
    }

    triggerSync({ rawText: smsText.trim() })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Zap className="h-5 w-5" />
              <DialogTitle className="text-xl">Sync Card / Bank Charge</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Enter any transaction details or paste a bank SMS to simulate real-time charge detection.
            </DialogDescription>
          </DialogHeader>

          {/* Tab switch */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                activeTab === "manual"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Enter Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sms")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                activeTab === "sms"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Paste Bank SMS
            </button>
          </div>

          {/* Manual Editable Form */}
          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="merchant" className="text-xs font-semibold">
                  Merchant / Service Name
                </Label>
                <Input
                  id="merchant"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. OpenAI, Spotify, Shell, Store name"
                  className="h-9 text-xs"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs font-semibold">
                    Amount (Rs.)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="any"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5600"
                    className="h-9 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="channel" className="text-xs font-semibold">
                    Payment Account / Channel
                  </Label>
                  <select
                    id="channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="EASYPAISA">Easypaisa</option>
                    <option value="JAZZCASH">JazzCash</option>
                    <option value="BANK">Bank Account (Meezan / HBL)</option>
                  </select>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full text-xs mt-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Simulating...
                  </>
                ) : (
                  "Simulate Charge Detection"
                )}
              </Button>
            </form>
          )}

          {/* SMS Paste Form */}
          {activeTab === "sms" && (
            <form onSubmit={handleSmsSubmit} className="space-y-3 py-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms" className="text-xs font-semibold">
                    Bank / Easypaisa SMS Text
                  </Label>
                </div>

                {/* Quick 1-click sample templates */}
                <div className="space-y-1 pb-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Click a realistic alert to test:</span>
                  <div className="flex flex-wrap gap-1">
                    {SAMPLE_SMS_TEMPLATES.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => setSmsText(sample.text)}
                        className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-muted/60 hover:bg-muted text-foreground transition-all font-medium"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  id="sms"
                  rows={4}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
                  placeholder="Paste real SMS alert e.g. from 3737, Meezan, HBL, or Visa..."
                />
                <p className="text-[10px] text-muted-foreground">
                  The smart engine parses merchant, amount, identifier, and category from Pakistani SMS formats.
                </p>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full text-xs">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Parsing...
                  </>
                ) : (
                  "Parse SMS & Simulate"
                )}
              </Button>
            </form>
          )}

          <DialogFooter className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsLinkModalOpen(true)
              }}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium self-start sm:self-auto"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Link Bank / Wallet &amp; Webhook</span>
            </button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LinkWalletModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
      />
    </>
  )
}
