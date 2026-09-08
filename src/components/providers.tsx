"use client"

import * as React from "react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { CurrencyProvider } from "@/lib/currency-context"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <CurrencyProvider>
          {children}
          <Toaster position="top-right" richColors />
        </CurrencyProvider>
      </NextThemesProvider>
    </SessionProvider>
  )
}
