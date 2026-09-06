import { describe, it, expect } from "vitest"
import { generateSecret, generateSync } from "otplib"
import {
  generateTwoFactorSetup,
  verifyTwoFactorToken,
  generateBackupCodes,
  verifyAndConsumeBackupCode,
} from "@/lib/two-factor"

describe("Two-Factor Authentication (2FA) Engine", () => {
  it("generates a valid TOTP secret, otpauth URI, and QR code", async () => {
    const email = "muneeb@example.com"
    const setup = await generateTwoFactorSetup(email)

    expect(setup.secret).toBeDefined()
    expect(setup.secret.length).toBeGreaterThanOrEqual(16)
    expect(setup.otpauth).toContain("otpauth://totp/")
    expect(setup.otpauth).toContain(encodeURIComponent(email))
    expect(setup.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/)
  })

  it("successfully validates correct TOTP token and rejects invalid token", () => {
    const secret = generateSecret()
    const validToken = generateSync({ secret })

    expect(verifyTwoFactorToken(validToken, secret)).toBe(true)
    expect(verifyTwoFactorToken("000000", secret)).toBe(false)
    expect(verifyTwoFactorToken("12345", secret)).toBe(false)
    expect(verifyTwoFactorToken("", secret)).toBe(false)
  })

  it("generates 8 unique emergency backup codes formatted as XXXX-XXXX", () => {
    const codes = generateBackupCodes(8)

    expect(codes).toHaveLength(8)
    // Check format XXXX-XXXX
    for (const code of codes) {
      expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/)
    }

    // Check all unique
    const unique = new Set(codes)
    expect(unique.size).toBe(8)
  })

  it("verifies and consumes a backup code once (case and dash insensitive)", () => {
    const codes = ["A1B2-C3D4", "E5F6-G7H8", "1122-3344"]

    // Test exact match
    const result1 = verifyAndConsumeBackupCode("A1B2-C3D4", codes)
    expect(result1.valid).toBe(true)
    expect(result1.remainingCodes).toHaveLength(2)
    expect(result1.remainingCodes).not.toContain("A1B2-C3D4")

    // Test lowercase without dash match
    const result2 = verifyAndConsumeBackupCode("e5f6g7h8", result1.remainingCodes)
    expect(result2.valid).toBe(true)
    expect(result2.remainingCodes).toHaveLength(1)
    expect(result2.remainingCodes).toContain("1122-3344")

    // Test invalid code
    const result3 = verifyAndConsumeBackupCode("WRONG-CODE", result2.remainingCodes)
    expect(result3.valid).toBe(false)
    expect(result3.remainingCodes).toEqual(result2.remainingCodes)
  })
})
