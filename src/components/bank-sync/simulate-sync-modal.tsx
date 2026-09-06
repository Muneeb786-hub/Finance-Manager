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
  CreditCard,
  Smartphone,
  Building2,
  Sparkles,
  Loader2,
  Zap,
  MessageSquare,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"

interface SimulateSyncModalProps {
  isOpen: boolean
  onClose: () => void
  onSyncTriggered?: () => void
}

const TEST_PRESETS = [
  {
    id: "openai",
    name: "OpenAI (ChatGPT)",
    amount: 5600,
    channel: "CARD" as const,
    label: "Rs. 5,600 • Credit Card",
    icon: <CreditCard className="h-4 w-4" />,
    badgeColor: "text-purple-500",
  },
  {
    id: "spotify",
    name: "Spotify Premium",
    amount: 599,
    channel: "EASYPAISA" as const,
    label: "Rs. 599 • Easypaisa",
    icon: <Smartphone className="h-4 w-4" />,
    badgeColor: "text-emerald-500",
  },
  {
    id: "careem",
    name: "Careem Ride",
    amount: 850,
    channel: "JAZZCASH" as const,
    label: "Rs. 850 • JazzCash",
    icon: <Smartphone className="h-4 w-4" />,
    badgeColor: "text-amber-500",
  },
  {
    id: "foodpanda",
    name: "Foodpanda Delivery",
    amount: 1450,
    channel: "CARD" as const,
    label: "Rs. 1,450 • Debit Card",
    icon: <CreditCard className="h-4 w-4" />,
    badgeColor: "text-rose-500",
  },
  {
    id: "kelectric",
    name: "K-Electric Bill",
    amount: 8200,
    channel: "BANK" as const,
    label: "Rs. 8,200 • Bank Account",
    icon: <Building2 className="h-4 w-4" />,
    badgeColor: "text-blue-500",
  },
]

export function SimulateSyncModal({
  isOpen,
  onClose,
  onSyncTriggered,
}: SimulateSyncModalProps) {
  const [activeTab, setActiveTab] = React.useState<"presets" | "custom" | "sms">("presets")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Custom form
  const [customMerchant, setCustomMerchant] = React.useState("OpenAI")
  const [customAmount, setCustomAmount] = React.useState("5600")
  const [customChannel, setCustomChannel] = React.useState<"CARD" | "EASYPAISA" | "JAZZCASH" | "BANK">("CARD")

  // SMS paste
  const [smsText, setSmsText] = React.useState(
    "Dear Customer, transaction of Rs 5,600.00 carried out on your Card ending 4242 at OPENAI on 06-Sep-2026. Available balance: Rs 42,000."
  )

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
        `Simulated ${payload.merchant || "card"} charge! Check the confirmation prompt above.`
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

  const handlePresetClick = (preset: typeof TEST_PRESETS[0]) => {
    triggerSync({
      merchant: preset.name,
      amount: preset.amount,
      channel: preset.channel,
    })
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customMerchant || !customAmount) {
      toast.error("Please enter merchant and amount")
      return
    }
    triggerSync({
      merchant: customMerchant,
      amount: parseFloat(customAmount),
      channel: customChannel,
    })
  }

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!smsText.trim()) {
      toast.error("Please paste SMS text")
      return
    }
    triggerSync({ rawText: smsText })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Zap className="h-5 w-5" />
            <DialogTitle className="text-xl">Simulate Bank / Card Sync</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Test automated detection for Easypaisa, JazzCash, or bank cards. Triggers the confirmation prompt in real time.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switch */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`py-1.5 rounded-md transition-all ${
              activeTab === "presets"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            1-Click Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`py-1.5 rounded-md transition-all ${
              activeTab === "custom"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Custom Charge
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sms")}
            className={`py-1.5 rounded-md transition-all ${
              activeTab === "sms"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Paste Bank SMS
          </button>
        </div>

        {/* Presets View */}
        {activeTab === "presets" && (
          <div className="space-y-2 py-2">
            <p className="text-[11px] text-muted-foreground font-medium">
              Click any realistic charge to trigger the real-time notification prompt:
            </p>
            <div className="space-y-2">
              {TEST_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border/70 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${preset.badgeColor}`}>
                      {preset.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {preset.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{preset.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <span>Simulate</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Form */}
        {activeTab === "custom" && (
          <form onSubmit={handleCustomSubmit} className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="merchant" className="text-xs">
                Merchant Name
              </Label>
              <Input
                id="merchant"
                value={customMerchant}
                onChange={(e) => setCustomMerchant(e.target.value)}
                placeholder="e.g. OpenAI, Netflix, Shell"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs">
                  Amount (Rs.)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="5600"
                  className="h-9 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="channel" className="text-xs">
                  Account / Channel
                </Label>
                <select
                  id="channel"
                  value={customChannel}
                  onChange={(e) => setCustomChannel(e.target.value as any)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="EASYPAISA">Easypaisa</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="BANK">Bank Account (Meezan/HBL)</option>
                </select>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full text-xs mt-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Simulating...
                </>
              ) : (
                "Simulate Charge"
              )}
            </Button>
          </form>
        )}

        {/* SMS Paste Form */}
        {activeTab === "sms" && (
          <form onSubmit={handleSmsSubmit} className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sms" className="text-xs">
                Raw Bank Alert SMS
              </Label>
              <textarea
                id="sms"
                rows={4}
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
                placeholder="Paste SMS text from 3737, Meezan, or Bank..."
              />
              <p className="text-[10px] text-muted-foreground">
                The smart parser automatically extracts merchant, amount, and payment channel.
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full text-xs">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Parsing...
                </>
              ) : (
                "Parse & Trigger Prompt"
              )}
            </Button>
          </form>
        )}

        <DialogFooter className="pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
