"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Key,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Download,
} from "lucide-react"
import { toast } from "sonner"

export function TwoFactorSettingsCard() {
  const [isEnabled, setIsEnabled] = React.useState(false)
  const [backupCodesCount, setBackupCodesCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)

  // Setup wizard state
  const [isSetupOpen, setIsSetupOpen] = React.useState(false)
  const [setupStep, setSetupStep] = React.useState<"SCAN" | "BACKUP">("SCAN")
  const [setupData, setSetupData] = React.useState<{
    secret: string
    otpauth: string
    qrCodeDataUrl: string
  } | null>(null)
  const [verificationCode, setVerificationCode] = React.useState("")
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [setupError, setSetupError] = React.useState<string | null>(null)
  const [generatedBackupCodes, setGeneratedBackupCodes] = React.useState<string[]>([])
  const [copiedSecret, setCopiedSecret] = React.useState(false)
  const [copiedCodes, setCopiedCodes] = React.useState(false)

  // Disable 2FA dialog state
  const [isDisableOpen, setIsDisableOpen] = React.useState(false)
  const [disablePassword, setDisablePassword] = React.useState("")
  const [disableCode, setDisableCode] = React.useState("")
  const [showDisablePass, setShowDisablePass] = React.useState(false)
  const [isDisabling, setIsDisabling] = React.useState(false)
  const [disableError, setDisableError] = React.useState<string | null>(null)

  const fetchStatus = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/auth/2fa/status")
      if (res.ok) {
        const data = await res.json()
        setIsEnabled(data.enabled)
        setBackupCodesCount(data.backupCodesRemaining || 0)
      }
    } catch (err) {
      console.error("Failed to fetch 2FA status", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const startSetup = async () => {
    setSetupError(null)
    setVerificationCode("")
    setSetupStep("SCAN")
    setIsSetupOpen(true)

    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" })
      if (!res.ok) throw new Error("Failed to initialize 2FA setup")
      const data = await res.json()
      setSetupData(data)
    } catch (err: any) {
      setSetupError(err.message || "Failed to initialize 2FA")
    }
  }

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationCode.trim() || !setupData?.secret) {
      setSetupError("Please enter the 6-digit code from your authenticator app")
      return
    }

    setIsVerifying(true)
    setSetupError(null)

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: setupData.secret,
          code: verificationCode.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Verification failed")
      }

      setGeneratedBackupCodes(data.backupCodes || [])
      setSetupStep("BACKUP")
      setIsEnabled(true)
      setBackupCodesCount(data.backupCodes?.length || 8)
      toast.success("Two-Factor Authentication is now enabled!")
    } catch (err: any) {
      setSetupError(err.message || "Verification code is invalid")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disablePassword) {
      setDisableError("Password is required to disable Two-Factor Authentication")
      return
    }

    setIsDisabling(true)
    setDisableError(null)

    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: disablePassword,
          code: disableCode.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Failed to disable 2FA")
      }

      setIsEnabled(false)
      setBackupCodesCount(0)
      setIsDisableOpen(false)
      setDisablePassword("")
      setDisableCode("")
      toast.info("Two-Factor Authentication has been disabled")
    } catch (err: any) {
      setDisableError(err.message || "Could not disable 2FA")
    } finally {
      setIsDisabling(false)
    }
  }

  const copySecret = () => {
    if (!setupData?.secret) return
    navigator.clipboard.writeText(setupData.secret)
    setCopiedSecret(true)
    toast.success("Key copied to clipboard!")
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  const copyBackupCodes = () => {
    if (generatedBackupCodes.length === 0) return
    navigator.clipboard.writeText(generatedBackupCodes.join("\n"))
    setCopiedCodes(true)
    toast.success("Backup codes copied to clipboard!")
    setTimeout(() => setCopiedCodes(false), 2000)
  }

  const downloadBackupCodes = () => {
    if (generatedBackupCodes.length === 0) return
    const text = `Finance Manager - Emergency Recovery Backup Codes\nGenerated on: ${new Date().toLocaleDateString()}\n\nEach code can only be used once:\n\n${generatedBackupCodes.join("\n")}\n\nKeep these codes in a secure place.`
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "finance-manager-backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                {isEnabled ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                )}
                <CardTitle className="text-base font-semibold">
                  Two-Factor Authentication (2FA)
                </CardTitle>
                {isLoading ? null : isEnabled ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-[10px]">
                    Disabled
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Protect your account and financial data with an authenticator app (Google Authenticator, Microsoft Authenticator, Authy)
              </CardDescription>
            </div>

            {isLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
            ) : isEnabled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDisableError(null)
                  setDisablePassword("")
                  setDisableCode("")
                  setIsDisableOpen(true)
                }}
                className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30 self-start sm:self-auto"
              >
                Disable 2FA
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={startSetup}
                className="h-8 gap-1.5 text-xs shadow-xs self-start sm:self-auto"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Enable 2FA
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Key className="h-4 w-4 text-primary" />
              <span>How 2FA Works</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              When 2FA is active, signing in requires both your password and a temporary 6-digit code from your authenticator app. Even if someone discovers your password, they cannot access your financial records without your authenticator device.
            </p>
            {isEnabled && (
              <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="h-3.5 w-3.5" />
                <span>Account protected. {backupCodesCount} emergency recovery codes available.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup Wizard Dialog */}
      <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <DialogTitle className="text-lg">Set Up Two-Factor Authentication</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              {setupStep === "SCAN"
                ? "Scan this QR code with Google Authenticator or Microsoft Authenticator."
                : "Save your emergency recovery backup codes in a safe place."}
            </DialogDescription>
          </DialogHeader>

          {setupStep === "SCAN" ? (
            <div className="space-y-4 py-2">
              {setupError && (
                <div className="flex items-center gap-2 p-2.5 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{setupError}</span>
                </div>
              )}

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-border shadow-xs">
                {setupData?.qrCodeDataUrl ? (
                  <img
                    src={setupData.qrCodeDataUrl}
                    alt="2FA QR Code"
                    className="w-44 h-44 rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {/* Manual Secret Key */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Can&apos;t scan? Enter key manually:
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={setupData?.secret || ""}
                    className="h-8 text-xs font-mono select-all bg-muted/40"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copySecret}
                    className="h-8 px-2.5 shrink-0 text-xs"
                  >
                    {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              {/* 6-Digit Code Verification */}
              <form onSubmit={handleVerifySetup} className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="verifyCode" className="text-xs font-semibold">
                    Enter 6-Digit Code from App
                  </Label>
                  <Input
                    id="verifyCode"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="h-10 text-center font-mono tracking-widest text-lg font-bold"
                    autoFocus
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSetupOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isVerifying} className="text-xs font-semibold">
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Verifying...
                      </>
                    ) : (
                      "Activate 2FA"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          ) : (
            /* Backup Codes Screen */
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>2FA is now active!</strong> Save these 8 one-time emergency backup recovery codes. If you ever lose your authenticator phone, these codes are the only way to recover account access.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-xl border border-border font-mono text-xs text-center font-semibold">
                {generatedBackupCodes.map((code, idx) => (
                  <div key={idx} className="p-1.5 rounded bg-background border border-border/60">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyBackupCodes}
                  className="flex-1 text-xs gap-1.5"
                >
                  {copiedCodes ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadBackupCodes}
                  className="flex-1 text-xs gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download .txt
                </Button>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  onClick={() => setIsSetupOpen(false)}
                  className="w-full text-xs font-semibold"
                >
                  I Have Saved My Backup Codes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle className="text-lg">Disable Two-Factor Authentication</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Disabling 2FA reduces your account security. Please confirm your password to proceed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDisable} className="space-y-3.5 py-2">
            {disableError && (
              <div className="flex items-center gap-2 p-2.5 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{disableError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="disablePassword" className="text-xs font-semibold">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="disablePassword"
                  type={showDisablePass ? "text" : "password"}
                  placeholder="Enter current password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="h-9 text-xs pr-9"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowDisablePass(!showDisablePass)}
                  className="absolute right-0 top-0 h-full px-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showDisablePass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="disableCode" className="text-xs font-semibold">
                Authenticator or Backup Code (Optional)
              </Label>
              <Input
                id="disableCode"
                type="text"
                placeholder="6-digit code or XXXX-XXXX"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDisableOpen(false)}
                disabled={isDisabling}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isDisabling}
                className="text-xs font-semibold"
              >
                {isDisabling ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Disabling...
                  </>
                ) : (
                  "Confirm & Disable 2FA"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
