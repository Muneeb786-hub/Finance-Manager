"use client"

import { useState, useEffect, useCallback } from "react"
import { Settings, User, Wallet, Tag, Database, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileSettingsTab } from "@/components/settings/profile-settings-tab"
import { AccountsSettingsTab, AccountRecord } from "@/components/settings/accounts-settings-tab"
import { CategoriesSettingsTab, CategoryRecord } from "@/components/settings/categories-settings-tab"
import { DataPrivacyTab } from "@/components/settings/data-privacy-tab"

type SettingsTab = "PROFILE" | "ACCOUNTS" | "CATEGORIES" | "DATA"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("PROFILE")
  const [user, setUser] = useState<any>(null)
  const [accounts, setAccounts] = useState<AccountRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSettingsData = useCallback(async () => {
    try {
      setLoading(true)
      const [profileRes, accountsRes, categoriesRes] = await Promise.all([
        fetch("/api/auth/profile"),
        fetch("/api/accounts"),
        fetch("/api/categories"),
      ])

      if (profileRes.ok) {
        const u = await profileRes.json()
        setUser(u)
      }
      if (accountsRes.ok) {
        const a = await accountsRes.json()
        setAccounts(a)
      }
      if (categoriesRes.ok) {
        const c = await categoriesRes.json()
        setCategories(c)
      }
    } catch (err) {
      console.error("Failed to load settings data", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettingsData()
  }, [fetchSettingsData])

  const tabs = [
    { id: "PROFILE" as const, label: "Profile & Preferences", icon: User },
    { id: "ACCOUNTS" as const, label: "Accounts", icon: Wallet },
    { id: "CATEGORIES" as const, label: "Categories", icon: Tag },
    { id: "DATA" as const, label: "Data & Privacy", icon: Database },
  ]

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings &amp; Configuration</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage user credentials, financial accounts, custom categories, and data portability
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettingsData}
          disabled={loading}
          className="h-9 gap-1.5 text-xs shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border pb-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 px-3.5 text-xs gap-2 whitespace-nowrap transition-all ${
                isActive ? "font-semibold border border-border/80 shadow-xs" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </Button>
          )
        })}
      </div>

      {/* Tab Panels */}
      {loading && !user ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          Loading user configurations...
        </div>
      ) : (
        <div>
          {activeTab === "PROFILE" && user && (
            <ProfileSettingsTab user={user} onProfileUpdated={fetchSettingsData} />
          )}

          {activeTab === "ACCOUNTS" && (
            <AccountsSettingsTab accounts={accounts} onRefresh={fetchSettingsData} />
          )}

          {activeTab === "CATEGORIES" && (
            <CategoriesSettingsTab categories={categories} onRefresh={fetchSettingsData} />
          )}

          {activeTab === "DATA" && (
            <DataPrivacyTab onDataWiped={fetchSettingsData} />
          )}
        </div>
      )}
    </div>
  )
}
