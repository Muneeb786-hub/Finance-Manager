import { generateSecret, generateURI, verifySync } from "otplib"
import QRCode from "qrcode"
import crypto from "crypto"

export interface TwoFactorSetupData {
  secret: string
  otpauth: string
  qrCodeDataUrl: string
}

/**
 * Generate a new TOTP secret and QR code for the user
 */
export async function generateTwoFactorSetup(userEmail: string): Promise<TwoFactorSetupData> {
  const secret = generateSecret()
  const appName = "Finance Manager"
  const otpauth = generateURI({
    secret,
    label: userEmail,
    issuer: appName,
  })

  const qrCodeDataUrl = await QRCode.toDataURL(otpauth, {
    margin: 1,
    width: 200,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  })

  return {
    secret,
    otpauth,
    qrCodeDataUrl,
  }
}

/**
 * Verify a 6-digit TOTP token against a user's secret
 */
export function verifyTwoFactorToken(token: string, secret: string): boolean {
  if (!token || !secret) return false
  const cleanToken = token.trim().replace(/\s+/g, "")
  if (cleanToken.length !== 6) return false

  try {
    const result = verifySync({
      token: cleanToken,
      secret,
    })
    return Boolean(result && result.valid)
  } catch (err) {
    return false
  }
}

/**
 * Generate 8 emergency one-time backup recovery codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString("hex").toUpperCase()
    // Format as XXXX-XXXX
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`)
  }
  return codes
}

/**
 * Verify if an entered code matches one of the user's backup codes,
 * and if valid, returns the updated list of remaining codes.
 */
export function verifyAndConsumeBackupCode(
  inputCode: string,
  backupCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
  if (!inputCode || !backupCodes || backupCodes.length === 0) {
    return { valid: false, remainingCodes: backupCodes || [] }
  }

  const normalizedInput = inputCode.trim().replace(/[-\s]/g, "").toUpperCase()

  const matchIndex = backupCodes.findIndex((code) => {
    const normalizedCode = code.replace(/[-\s]/g, "").toUpperCase()
    return normalizedCode === normalizedInput
  })

  if (matchIndex !== -1) {
    const remainingCodes = [...backupCodes]
    remainingCodes.splice(matchIndex, 1)
    return { valid: true, remainingCodes }
  }

  return { valid: false, remainingCodes: backupCodes }
}
