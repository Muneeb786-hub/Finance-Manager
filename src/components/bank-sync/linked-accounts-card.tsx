"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Smartphone,
  CreditCard,
  Building2,
  Plus,
  Trash2,
  Copy,
  Check,
  Radio,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { LinkWalletModal, PROVIDER_OPTIONS } from "./link-wallet-modal"

export interface LinkedAccountItem {
  id: string
  provider: string
  accountName: string
  identifier: string
  senderId?: string | null
  isActive: boolean
  lastSyncedAt?: string | null
  createdAt: string
  account?: {
    id: string
    name: string
  } | null
}

interface LinkedAccountsCardProps {
  existingLedgerAccounts?: { id: string; name: string }[]
}

export function LinkedAccountsCard({ existingLedgerAccounts = [] }: LinkedAccountsCardProps) {
  const [linkedAccounts, setLinkedAccounts] = React.useState<LinkedAccountItem[]>([])
  const [webhookUrl, setWebhookUrl] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLinkModalOpen, setIsLinkModalOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [unlinkingId, setUnlinkingId] = React.useState<string | null>(null)

  const fetchLinkedData = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/bank-sync/linked")
      if (res.ok) {
        const data = await res.json()
        setLinkedAccounts(data.linkedAccounts || [])
        setWebhookUrl(data.webhookUrl || "")
      }
    } catch (err) {
      console.error("Failed to load linked accounts", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchLinkedData()
  }, [fetchLinkedData])

  const handleCopyWebhook = () => {
    if (!webhookUrl) return
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    toast.success("Webhook URL copied to clipboard!")
    setTimeout(() => setCopied(false), 2500)
  }

  const handleUnlink = async (id: string, name: string) => {
    setUnlinkingId(id)
    try {
      const res = await fetch(`/api/bank-sync/linked/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to unlink")
      toast.info(`Unlinked ${name}`)
      setLinkedAccounts((prev) => prev.filter((a) => a.id !== id))
    } catch (err: any) {
      toast.error(err.message || "Failed to unlink account")
    } finally {
      setUnlinkingId(null)
    }
  }

  const getProviderInfo = (providerKey: string) => {
    return (
      PROVIDER_OPTIONS.find((p) => p.id === providerKey) || {
        id: providerKey,
        name: providerKey.replace(/_/g, " "),
        badgeColor: "bg-muted text-foreground border-border",
        type: "BANK_ACCOUNT",
      }
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-emerald-500 animate-pulse" />
                <CardTitle className="text-base font-semibold">
                  Linked Banks &amp; Mobile Wallets (SMS Sync)
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Link Easypaisa, JazzCash, Meezan Bank, or Cards to automatically detect real-time transaction alerts
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setIsLinkModalOpen(true)}
              className="h-8 gap-1.5 text-xs shadow-xs self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              Link Wallet or Bank
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span>Loading linked accounts...</span>
            </div>
          ) : linkedAccounts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center space-y-2 bg-muted/20">
              <Smartphone className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <p className="text-xs font-semibold text-foreground">No Wallets or Cards Linked Yet</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Click &quot;Link Wallet or Bank&quot; to connect your Easypaisa (3737), JazzCash (8558), or Meezan Bank account.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {linkedAccounts.map((acc) => {
                const info = getProviderInfo(acc.provider)
                const isUnlinking = unlinkingId === acc.id

                return (
                  <div
                    key={acc.id}
                    className="p-3.5 rounded-xl border border-border bg-card/80 hover:bg-muted/30 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-muted/60 border border-border/50 shrink-0">
                        {info.type === "DIGITAL_WALLET" ? (
                          <Smartphone className="h-4 w-4 text-emerald-500" />
                        ) : info.type === "BANK_ACCOUNT" ? (
                          <Building2 className="h-4 w-4 text-blue-500" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-purple-500" />
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-foreground truncate">{acc.accountName}</h4>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" title="Active Sync" />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${info.badgeColor}`}>
                            {info.name}
                          </Badge>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {acc.identifier}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnlink(acc.id, acc.accountName)}
                      disabled={isUnlinking}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      title="Unlink account"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Automated Webhook Info Card */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-foreground">
                  Automated Phone SMS Forwarding (Android / Tasker / Shortcuts)
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">Private Webhook Endpoint</span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              To automatically capture transactions from your phone in real time, set any free Android SMS forwarder (e.g. <em>SMS Forwarder</em> or <em>Tasker</em>) to forward SMS from <strong>3737</strong>, <strong>8558</strong>, or your bank to your private webhook URL:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl || "Loading webhook URL..."}
                className="flex h-8 w-full rounded-md border border-input bg-background/80 px-2.5 text-[11px] font-mono text-muted-foreground select-all focus:outline-none"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyWebhook}
                disabled={!webhookUrl}
                className="h-8 px-2.5 text-xs shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy URL
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <LinkWalletModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onAccountLinked={fetchLinkedData}
        existingLedgerAccounts={existingLedgerAccounts}
      />
    </div>
  )
}
