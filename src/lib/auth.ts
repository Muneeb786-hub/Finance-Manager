import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { verifyTwoFactorToken, verifyAndConsumeBackupCode } from "@/lib/two-factor"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          return null
        }

        // Two-factor authentication check
        if (user.twoFactorEnabled) {
          const twoFactorCode = credentials.twoFactorCode?.trim()

          if (!twoFactorCode) {
            throw new Error("2FA_REQUIRED")
          }

          let isCodeValid = false
          if (user.twoFactorSecret) {
            isCodeValid = verifyTwoFactorToken(twoFactorCode, user.twoFactorSecret)
          }

          // If TOTP check failed, check emergency backup recovery codes
          if (!isCodeValid && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
            const backupResult = verifyAndConsumeBackupCode(twoFactorCode, user.twoFactorBackupCodes)
            if (backupResult.valid) {
              isCodeValid = true
              // Consume the used backup code
              await db.user.update({
                where: { id: user.id },
                data: { twoFactorBackupCodes: backupResult.remainingCodes },
              }).catch(() => {})
            }
          }

          if (!isCodeValid) {
            throw new Error("INVALID_2FA_CODE")
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          preferredCurrency: user.preferredCurrency,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.preferredCurrency = (user as any).preferredCurrency || "USD"
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).preferredCurrency = (token.preferredCurrency as string) || "USD"
      }
      return session
    },
  },
}
