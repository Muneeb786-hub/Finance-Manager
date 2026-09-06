"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { LoginSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

type LoginFormValues = z.infer<typeof LoginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [authError, setAuthError] = React.useState<string | null>(null)

  // 2FA challenge states
  const [is2FARequired, setIs2FARequired] = React.useState(false)
  const [twoFactorCode, setTwoFactorCode] = React.useState("")
  const [isBackupMode, setIsBackupMode] = React.useState(false)
  const [savedCredentials, setSavedCredentials] = React.useState<{ email: string; password: string } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      const res = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      })

      if (res?.error === "2FA_REQUIRED" || res?.error?.includes("2FA_REQUIRED")) {
        setSavedCredentials({ email: data.email.toLowerCase(), password: data.password })
        setIs2FARequired(true)
        setIsLoading(false)
        setAuthError(null)
        return
      }

      if (res?.error) {
        setAuthError("Invalid email or password. Please try again.")
        setIsLoading(false)
        return
      }

      toast.success("Welcome back!")
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setAuthError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!twoFactorCode.trim() || !savedCredentials) {
      setAuthError("Please enter your verification code")
      return
    }

    setIsLoading(true)
    setAuthError(null)

    try {
      const res = await signIn("credentials", {
        email: savedCredentials.email,
        password: savedCredentials.password,
        twoFactorCode: twoFactorCode.trim(),
        redirect: false,
      })

      if (res?.error === "INVALID_2FA_CODE" || res?.error?.includes("INVALID_2FA_CODE")) {
        setAuthError(
          isBackupMode
            ? "Invalid or already consumed backup code. Please try another code."
            : "Invalid 6-digit verification code. Make sure your device time is synchronized."
        )
        setIsLoading(false)
        return
      }

      if (res?.error) {
        setAuthError("Verification failed. Please try again.")
        setIsLoading(false)
        return
      }

      toast.success("Authentication successful! Welcome back.")
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setAuthError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setValue("email", "demo@example.com")
    setValue("password", "password123")
  }

  const resetToStandardLogin = () => {
    setIs2FARequired(false)
    setTwoFactorCode("")
    setIsBackupMode(false)
    setSavedCredentials(null)
    setAuthError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-lg border-border/80">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
            <Wallet className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {is2FARequired ? "Two-Factor Verification" : "Sign In"}
          </CardTitle>
          <CardDescription className="text-xs">
            {is2FARequired
              ? isBackupMode
                ? "Enter one of your 8-character backup recovery codes."
                : "Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.)."
              : "Enter your credentials to access your financial dashboard"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {authError && (
            <div className="flex items-center gap-2 p-3 mb-4 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {is2FARequired ? (
            /* 2FA Challenge Form */
            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="twoFactorCode" className="text-xs font-semibold">
                    {isBackupMode ? "Emergency Backup Code" : "6-Digit Authenticator Code"}
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBackupMode(!isBackupMode)
                      setTwoFactorCode("")
                      setAuthError(null)
                    }}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    {isBackupMode ? "Use Authenticator App" : "Use Backup Code"}
                  </button>
                </div>
                <Input
                  id="twoFactorCode"
                  type="text"
                  placeholder={isBackupMode ? "e.g. A1B2-C3D4" : "123456"}
                  maxLength={isBackupMode ? 12 : 8}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  className="text-center font-mono tracking-widest text-lg font-bold h-11"
                  autoComplete="one-time-code"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  "Verify & Sign In"
                )}
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={resetToStandardLogin}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  &larr; Back to standard login
                </button>
              </div>
            </form>
          ) : (
            /* Standard Email + Password Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={fillDemoCredentials}
                >
                  Fill Demo User Credentials
                </Button>
              </div>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t border-border/40 py-4">
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
