"use client"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sparkles,
  User,
  Wallet,
  PiggyBank,
  Target,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Database,
  Rocket,
} from "lucide-react"

interface OnboardingWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  initialName?: string
  initialCurrency?: string
}

export function OnboardingWizard({
  isOpen,
  onClose,
  onComplete,
  initialName = "",
  initialCurrency = "USD",
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 5

  // Form states
  const [name, setName] = useState(initialName)
  const [currency, setCurrency] = useState(initialCurrency)
  const [timezone, setTimezone] = useState("UTC")
  const [initialBalance, setInitialBalance] = useState("1000")
  const [budgetCategoryId, setBudgetCategoryId] = useState("")
  const [budgetAmount, setBudgetAmount] = useState("400")
  const [goalTitle, setGoalTitle] = useState("Emergency Reserve")
  const [goalTargetAmount, setGoalTargetAmount] = useState("3000")
  const [seedDemoData, setSeedDemoData] = useState(false)

  // Categories list for step 3
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetch("/api/categories?type=EXPENSE")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data)
            setBudgetCategoryId(data[0].id)
          }
        })
        .catch((err) => console.error(err))
    }
  }, [isOpen])

  const handleFinish = async (enableSandbox = false) => {
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "User",
          preferredCurrency: currency,
          timezone,
          initialBalance: parseFloat(initialBalance) || 0,
          budgetCategoryId: budgetCategoryId || undefined,
          budgetAmount: budgetAmount ? parseFloat(budgetAmount) : undefined,
          goalTitle: goalTitle.trim() || undefined,
          goalTargetAmount: goalTargetAmount ? parseFloat(goalTargetAmount) : undefined,
          seedDemoData: enableSandbox,
        }),
      })

      if (res.ok) {
        onComplete()
        onClose()
      } else {
        const json = await res.json()
        setErrorMsg(json.message || "Failed to complete onboarding.")
      }
    } catch (err) {
      setErrorMsg("A network error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-border/80 shadow-xl">
        {/* Wizard Header Banner */}
        <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-background p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  Guided Financial Setup
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Step {step} of {totalSteps}: {
                    step === 1 ? "Profile & Currency" :
                    step === 2 ? "Initial Ledger" :
                    step === 3 ? "Spending Budget" :
                    step === 4 ? "Savings Goal" : "Sandbox Demo & Launch"
                  }
                </DialogDescription>
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i === step
                      ? "w-6 bg-primary"
                      : i < step
                      ? "w-2 bg-primary/40"
                      : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Wizard Step Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Profile & Currency */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4 text-primary" />
                  What should we call you?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Personalize your dashboard greetings and financial reports.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onboardingName" className="text-xs">Your Name</Label>
                <Input
                  id="onboardingName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Smith"
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="onboardingCurrency" className="text-xs">Base Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="onboardingCurrency" className="h-9 text-xs">
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
                  <Label htmlFor="onboardingTimezone" className="text-xs">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="onboardingTimezone" className="h-9 text-xs">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                      <SelectItem value="America/New_York">America/New York (EST/EDT)</SelectItem>
                      <SelectItem value="America/Chicago">America/Chicago (CST/CDT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los Angeles (PST/PDT)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                      <SelectItem value="Asia/Karachi">Asia/Karachi (PKT)</SelectItem>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Initial Balance */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Wallet className="h-4 w-4 text-primary" />
                  Starting Bank &amp; Cash Balance
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your current liquid funds so your net worth calculates accurately from day one.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onboardingBalance" className="text-xs">Initial Total Balance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                    {currency}
                  </span>
                  <Input
                    id="onboardingBalance"
                    type="number"
                    step="0.01"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="0.00"
                    className="pl-14 h-9 text-xs font-mono"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">
                  You can add multiple individual accounts (Checking, Credit Cards, Cash) anytime in Settings.
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: First Budget */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <PiggyBank className="h-4 w-4 text-primary" />
                  Set Your First Monthly Budget (Optional)
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Budget caps alert you when spending in a category reaches 80% of your threshold.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="onboardingCat" className="text-xs">Expense Category</Label>
                  <Select value={budgetCategoryId} onValueChange={setBudgetCategoryId}>
                    <SelectTrigger id="onboardingCat" className="h-9 text-xs">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="onboardingBudgetAmt" className="text-xs">Monthly Limit ($)</Label>
                  <Input
                    id="onboardingBudgetAmt"
                    type="number"
                    step="0.01"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="400"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Savings Goal */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Target className="h-4 w-4 text-primary" />
                  Define a Primary Savings Milestone (Optional)
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Track progress towards an Emergency Reserve, travel fund, or investment goal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="onboardingGoalTitle" className="text-xs">Goal Milestone Name</Label>
                  <Input
                    id="onboardingGoalTitle"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g. Rainy Day Fund"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="onboardingGoalTarget" className="text-xs">Target Amount ($)</Label>
                  <Input
                    id="onboardingGoalTarget"
                    type="number"
                    step="0.01"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    placeholder="3000"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Launch & Sandbox Option */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Setup Complete &amp; Ready!</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your baseline preferences have been recorded. How would you like to start?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Sandbox Demo Option */}
                <div
                  onClick={() => setSeedDemoData(true)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    seedDemoData
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-border/80 bg-card/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Sandbox Demo Mode</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Populates realistic transactions, historical 3-month charts, budgets, and insights to test every feature right away.
                  </p>
                </div>

                {/* Clean Slate Option */}
                <div
                  onClick={() => setSeedDemoData(false)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    !seedDemoData
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-border/80 bg-card/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Fresh Clean Slate</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Start with empty charts and begin recording your real income and expense transactions manually.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <DialogFooter className="p-6 pt-3 border-t border-border flex items-center justify-between sm:justify-between bg-muted/20">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(step - 1)}
                className="h-8 gap-1.5 text-xs text-muted-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < totalSteps ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep(step + 1)}
                className="h-8 gap-1.5 text-xs shadow-xs"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => handleFinish(seedDemoData)}
                disabled={isSubmitting}
                className="h-8 gap-1.5 text-xs shadow-xs"
              >
                {isSubmitting ? "Launching..." : seedDemoData ? "Load Sandbox & Launch" : "Launch Clean Workspace"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
