import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { decryptTwoFactorSecret, encryptTwoFactorSecret, secureStoredBackupCodes, verifyTwoFactorToken, verifyAndConsumeBackupCode } from "@/lib/two-factor"
import { checkRateLimit, configuredLimit, getClientAddress } from "@/lib/rate-limit"

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
      async authorize(credentials, request) {
        const address = getClientAddress(request)
        const rate = checkRateLimit("login", address, configuredLimit("RATE_LIMIT_LOGIN_MAX", 10), 15 * 60 * 1000)
        if (!rate.allowed) throw new Error("RATE_LIMITED")
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
            const decryptedSecret = decryptTwoFactorSecret(user.twoFactorSecret)
            isCodeValid = verifyTwoFactorToken(twoFactorCode, decryptedSecret)
            if (isCodeValid && !user.twoFactorSecret.startsWith("enc:v1:")) {
              await db.user.update({ where: { id: user.id }, data: { twoFactorSecret: encryptTwoFactorSecret(decryptedSecret) } })
            }
          }

          // If TOTP check failed, check emergency backup recovery codes
          if (!isCodeValid && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
            const backupResult = await verifyAndConsumeBackupCode(twoFactorCode, user.twoFactorBackupCodes)
            if (backupResult.valid) {
              const securedRemainingCodes = await secureStoredBackupCodes(backupResult.remainingCodes)
              const consumed = await db.user.updateMany({
                where: { id: user.id, twoFactorBackupCodes: { equals: user.twoFactorBackupCodes } },
                data: { twoFactorBackupCodes: securedRemainingCodes },
              })
              isCodeValid = consumed.count === 1
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
