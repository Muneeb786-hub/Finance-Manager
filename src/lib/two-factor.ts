import { generateSecret, generateURI, verifySync } from "otplib"
import QRCode from "qrcode"
import crypto from "crypto"
import bcrypt from "bcryptjs"

export interface TwoFactorSetupData {
  secret: string
  otpauth: string
  qrCodeDataUrl: string
}

const ENCRYPTED_PREFIX = "enc:v1:"

function encryptionKey(): Buffer {
  const configured = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET
  if (!configured) {
    throw new Error("TWO_FACTOR_ENCRYPTION_KEY is required")
  }
  return crypto.createHash("sha256").update(configured).digest()
}

export function encryptTwoFactorSecret(secret: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${ENCRYPTED_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`
}

export function decryptTwoFactorSecret(value: string): string {
  if (!value.startsWith(ENCRYPTED_PREFIX)) return value // legacy plaintext; re-encrypted on next setup
  const [ivPart, tagPart, ciphertextPart] = value.slice(ENCRYPTED_PREFIX.length).split(":")
  if (!ivPart || !tagPart || !ciphertextPart) throw new Error("Invalid encrypted 2FA secret")
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64"))
  decipher.setAuthTag(Buffer.from(tagPart, "base64"))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64")),
    decipher.final(),
  ]).toString("utf8")
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
      // Accept one adjacent 30-second step for normal authenticator/device clock drift.
      epochTolerance: 30,
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

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(normalizeBackupCode(code), 10)))
}

export async function secureStoredBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => code.startsWith("$2") ? code : bcrypt.hash(normalizeBackupCode(code), 10)))
}

function normalizeBackupCode(code: string): string {
  return code.trim().replace(/[-\s]/g, "").toUpperCase()
}

/**
 * Verify if an entered code matches one of the user's backup codes,
 * and if valid, returns the updated list of remaining codes.
 */
export async function verifyAndConsumeBackupCode(
  inputCode: string,
  backupCodes: string[]
): Promise<{ valid: boolean; remainingCodes: string[] }> {
  if (!inputCode || !backupCodes || backupCodes.length === 0) {
    return { valid: false, remainingCodes: backupCodes || [] }
  }

  const normalizedInput = normalizeBackupCode(inputCode)
  let matchIndex = -1
  for (let index = 0; index < backupCodes.length; index++) {
    const stored = backupCodes[index]
    const matches = stored.startsWith("$2")
      ? await bcrypt.compare(normalizedInput, stored)
      : normalizeBackupCode(stored) === normalizedInput
    if (matches) {
      matchIndex = index
      break
    }
  }

  if (matchIndex !== -1) {
    const remainingCodes = [...backupCodes]
    remainingCodes.splice(matchIndex, 1)
    return { valid: true, remainingCodes }
  }

  return { valid: false, remainingCodes: backupCodes }
}
