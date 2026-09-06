import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  Receipt,
  PiggyBank,
  Target,
  Repeat,
  BarChart3,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="border-b border-border/80 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight">Personal Finance Manager</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-6">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Private, Self-Managed Financial Platform</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight sm:leading-none">
          Master your money with clarity and confidence
        </h1>
        <p className="mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Track income, expenses, category budgets, savings goals, and recurring payments. Gain educational observations with our built-in Financial Insights feature.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto text-base gap-2 shadow-md">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base">
              Explore Demo Dashboard
            </Button>
          </Link>
        </div>

        {/* Privacy Note Banner */}
        <div className="mt-12 rounded-xl border border-border bg-card/60 p-4 max-w-2xl mx-auto text-left flex items-start gap-3 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Strict Privacy & No Bank Linking: </span>
            This application does not connect directly to real bank accounts or third-party institutions. All financial data is strictly user-entered, private, and contained within your authenticated account.
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-12 bg-muted/30 border-y border-border px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Comprehensive Portfolio Features</h2>
            <p className="mt-2 text-sm text-muted-foreground">Everything needed to organize, project, and evaluate personal cash flow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border/60 hover:border-primary/50 transition-all hover:shadow-md">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <Receipt className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Transaction Tracking</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Log income and expenses with categories, payment methods, accounts, and tags. Fast searching, multi-filter sorting, and CSV export.
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:border-primary/50 transition-all hover:shadow-md">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Category Budgets</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Create monthly category targets with custom alert thresholds (e.g. 80%). Real-time visual progress and proactive status badges.
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:border-primary/50 transition-all hover:shadow-md">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                  <Target className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Savings Goals</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Track savings milestones with contribution histories, estimated monthly requirements, and celebratory completion notifications.
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:border-primary/50 transition-all hover:shadow-md">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                  <Repeat className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Recurring Transactions</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Automate scheduled transactions across daily, weekly, monthly, and yearly cadences with safe server-side idempotency.
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:border-primary/50 transition-all hover:shadow-md">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Visual Analytics</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Interactive charts for spending by category, cash flow trends, historical budget performance, and year-to-date summaries.
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:border-primary/50 transition-all hover:shadow-md">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2">
                  <Sparkles className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Financial Insights</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Server-side analysis of your recorded transactions and budgets that highlights changes, budget pacing, and organizational suggestions.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Educational Disclaimer Section */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-xs text-muted-foreground space-y-2">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            Important Educational Disclaimer
          </h3>
          <p className="leading-relaxed">
            “Financial Insights are provided for general educational and organizational purposes only. They are not financial, investment, tax, legal, or professional advice.”
          </p>
          <p className="leading-relaxed">
            This portfolio project does not make investment recommendations, tell users to buy or sell assets, advise on loans, or provide personalized regulated financial guidance.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8 px-4 sm:px-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Personal Finance Manager. Built for student portfolio demonstration.</p>
      </footer>
    </div>
  )
}
