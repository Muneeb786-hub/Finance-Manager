"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Lock, Check, AlertCircle, Eye, EyeOff } from "lucide-react"

interface ProfileSettingsTabProps {
  user: {
    id: string
    name: string
    email: string
    preferredCurrency: string
    timezone: string
  }
  onProfileUpdated: () => void
}

export function ProfileSettingsTab({ user, onProfileUpdated }: ProfileSettingsTabProps) {
  const [name, setName] = useState(user.name || "")
  const [currency, setCurrency] = useState(user.preferredCurrency || "USD")
  const [timezone, setTimezone] = useState(user.timezone || "UTC")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileMsg(null)

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, preferredCurrency: currency, timezone }),
      })

      if (res.ok) {
        setProfileMsg({ type: "success", text: "Profile preferences updated successfully!" })
        onProfileUpdated()
        setTimeout(() => setProfileMsg(null), 4000)
      } else {
        const data = await res.json()
        setProfileMsg({ type: "error", text: data.message || "Failed to update profile." })
      }
    } catch (err) {
      setProfileMsg({ type: "error", text: "A network error occurred." })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." })
      return
    }

    setIsChangingPassword(true)
    setPasswordMsg(null)

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        setPasswordMsg({ type: "success", text: "Password changed successfully!" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setPasswordMsg(null), 4000)
      } else {
        const data = await res.json()
        setPasswordMsg({ type: "error", text: data.message || "Failed to change password." })
      }
    } catch (err) {
      setPasswordMsg({ type: "error", text: "A network error occurred." })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Details Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">User Profile &amp; Preferences</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Manage your display name, base financial currency, and reporting timezone
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            {profileMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  profileMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {profileMsg.type === "success" ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email Address</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="h-9 text-xs bg-muted/50 cursor-not-allowed"
              />
              <span className="text-[10px] text-muted-foreground">
                Email address is tied to your account credentials.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-xs">Base Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" className="h-9 text-xs">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                    <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD ($) - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD ($) - Australian Dollar</SelectItem>
                    <SelectItem value="JPY">JPY (¥) - Japanese Yen</SelectItem>
                    <SelectItem value="PKR">PKR (Rs) - Pakistani Rupee</SelectItem>
                    <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timezone" className="text-xs">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone" className="h-9 text-xs">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                    <SelectItem value="America/New_York">America/New York (EST/EDT)</SelectItem>
                    <SelectItem value="America/Chicago">America/Chicago (CST/CDT)</SelectItem>
                    <SelectItem value="America/Denver">America/Denver (MST/MDT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los Angeles (PST/PDT)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris (CET/CEST)</SelectItem>
                    <SelectItem value="Asia/Karachi">Asia/Karachi (PKT)</SelectItem>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" size="sm" disabled={isSavingProfile} className="text-xs h-9 shadow-xs">
              {isSavingProfile ? "Saving changes..." : "Save Preferences"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security & Password Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Security &amp; Password</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Update your account password with salted bcrypt encryption
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
            {passwordMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {passwordMsg.type === "success" ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="currentPass" className="text-xs">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPass"
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="h-9 text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-0 top-0 h-full px-2.5 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center focus:outline-none"
                  tabIndex={-1}
                  aria-label={showCurrentPass ? "Hide password" : "Show password"}
                >
                  {showCurrentPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPass" className="text-xs">New Password (min 8 chars)</Label>
                <div className="relative">
                  <Input
                    id="newPass"
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    required
                    className="h-9 text-xs pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-0 top-0 h-full px-2.5 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center focus:outline-none"
                    tabIndex={-1}
                    aria-label={showNewPass ? "Hide password" : "Show password"}
                  >
                    {showNewPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPass" className="text-xs">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPass"
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    required
                    className="h-9 text-xs pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-0 top-0 h-full px-2.5 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center focus:outline-none"
                    tabIndex={-1}
                    aria-label={showConfirmPass ? "Hide password" : "Show password"}
                  >
                    {showConfirmPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" size="sm" variant="outline" disabled={isChangingPassword} className="text-xs h-9 shadow-xs">
              {isChangingPassword ? "Updating password..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
