export interface ParsedBankAlert {
  amount: number
  merchant: string
  currency: string
  channel: "EASYPAISA" | "JAZZCASH" | "CARD" | "BANK"
  suggestedCategoryName: string
  extractedIdentifier?: string
  providerHint?: string
  rawText?: string
}

// Known merchant pattern dictionary
export const MERCHANT_CATEGORY_MAP: { pattern: RegExp; category: string; formattedName: string }[] = [
  // Subscriptions & Tech
  { pattern: /open\s*ai|chat\s*gpt/i, category: "Subscriptions", formattedName: "OpenAI" },
  { pattern: /spotify/i, category: "Subscriptions", formattedName: "Spotify" },
  { pattern: /netflix/i, category: "Subscriptions", formattedName: "Netflix" },
  { pattern: /youtube/i, category: "Subscriptions", formattedName: "YouTube Premium" },
  { pattern: /google\s*(one|storage|play)/i, category: "Subscriptions", formattedName: "Google One" },
  { pattern: /apple|icloud/i, category: "Subscriptions", formattedName: "Apple Services" },
  { pattern: /cursor|github|copilot/i, category: "Subscriptions", formattedName: "GitHub / Developer Tool" },

  // Transport & Fuel
  { pattern: /careem/i, category: "Transport", formattedName: "Careem" },
  { pattern: /uber/i, category: "Transport", formattedName: "Uber" },
  { pattern: /bykea/i, category: "Transport", formattedName: "Bykea" },
  { pattern: /indrive/i, category: "Transport", formattedName: "InDrive" },
  { pattern: /shell|total|pso|attock/i, category: "Transport", formattedName: "Fuel / Petrol Station" },

  // Food & Dining
  { pattern: /foodpanda/i, category: "Food", formattedName: "Foodpanda" },
  { pattern: /mcdonald/i, category: "Food", formattedName: "McDonald's" },
  { pattern: /kfc/i, category: "Food", formattedName: "KFC" },
  { pattern: /subway|domino|pizza\s*hut/i, category: "Food", formattedName: "Fast Food Restaurant" },

  // Utilities & Bills
  { pattern: /k-?electric|kelectric/i, category: "Bills", formattedName: "K-Electric Bill" },
  { pattern: /lesco|gepco|fesco/i, category: "Bills", formattedName: "Electricity Bill" },
  { pattern: /sngpl|ssgc/i, category: "Bills", formattedName: "Gas Utility Bill" },
  { pattern: /nayatel|ptcl|stormfiber/i, category: "Bills", formattedName: "Internet Fiber Bill" },

  // Shopping & E-Commerce
  { pattern: /daraz/i, category: "Shopping", formattedName: "Daraz Online" },
  { pattern: /amazon/i, category: "Shopping", formattedName: "Amazon" },
  { pattern: /aliexpress/i, category: "Shopping", formattedName: "AliExpress" },
]

/**
 * Identify merchant name and suggest an expense category
 */
export function detectMerchantAndCategory(text: string): { merchant: string; category: string } {
  const normalized = text.trim()

  for (const item of MERCHANT_CATEGORY_MAP) {
    if (item.pattern.test(normalized)) {
      return {
        merchant: item.formattedName,
        category: item.category,
      }
    }
  }

  // Fallback: clean up alphanumeric string
  const cleaned = normalized.replace(/[^a-zA-Z0-9\s.-]/g, "").slice(0, 30).trim()
  return {
    merchant: cleaned || "Bank Card Charge",
    category: "Other",
  }
}

/**
 * Parse an incoming SMS or transaction alert text
 * Supports:
 * - Easypaisa (3737)
 * - JazzCash (8558)
 * - Meezan Bank & Pakistani Banks (HBL, Alfalah, Standard Chartered)
 * - SadaPay & NayaPay
 * - Standard Visa / Mastercard
 */
export function parseBankAlert(text: string): ParsedBankAlert {
  const normalized = text.replace(/,/g, "")

  // Detect channel & provider hint
  let channel: "EASYPAISA" | "JAZZCASH" | "CARD" | "BANK" = "CARD"
  let providerHint = "CARD"

  if (/jazzcash|8558/i.test(text)) {
    channel = "JAZZCASH"
    providerHint = "JAZZCASH"
  } else if (/easypaisa|3737|mobile\s*account/i.test(text)) {
    channel = "EASYPAISA"
    providerHint = "EASYPAISA"
  } else if (/meezan/i.test(text)) {
    channel = "BANK"
    providerHint = "MEEZAN_BANK"
  } else if (/hbl/i.test(text)) {
    channel = "BANK"
    providerHint = "HBL"
  } else if (/sadapay/i.test(text)) {
    channel = "CARD"
    providerHint = "SADAPAY"
  } else if (/nayapay/i.test(text)) {
    channel = "CARD"
    providerHint = "NAYAPAY"
  } else if (/bank|alfalah|standard chartered|mcb|ubl/i.test(text)) {
    channel = "BANK"
    providerHint = "BANK"
  }

  // Extract amount
  // Matches: Rs. 5600, Rs 5600.00, PKR 5600, $20.00, 5600.00 PKR
  const amountMatch =
    normalized.match(/(?:rs\.?|pkr|\$)\s*([\d]+(?:\.\d{1,2})?)/i) ||
    normalized.match(/([\d]+(?:\.\d{1,2})?)\s*(?:rs|pkr)/i)

  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0

  // Extract identifier (phone number e.g. 03001234567 or card last 4 e.g. ending in 4242)
  let extractedIdentifier: string | undefined
  const cardMatch = text.match(/(?:ending\s+(?:in\s+)?|card\s+(?:ending\s+)?|card\s+#?\s*)(\d{4})/i)
  if (cardMatch) {
    extractedIdentifier = cardMatch[1]
  } else {
    const mobileMatch = text.match(/(?:account|mobile|no\.?|wallet)\s*(03\d{9})/i)
    if (mobileMatch) {
      extractedIdentifier = mobileMatch[1]
    }
  }

  // Extract merchant
  // Matches: "at OPENAI", "to OPENAI", "paid at OPENAI", "for OPENAI"
  let merchantCandidate = ""
  const merchantMatch =
    text.match(/(?:at|to|towards|for)\s+([A-Za-z0-9\s&.-]+?)(?:\s+(?:on|from|using|via|fee|balance|ref|trx|tid|with|\.))/i) ||
    text.match(/(?:at|to)\s+([A-Za-z0-9\s&.-]+)$/i)

  if (merchantMatch) {
    merchantCandidate = merchantMatch[1].trim()
  } else {
    merchantCandidate = text
  }

  const { merchant, category } = detectMerchantAndCategory(merchantCandidate)

  return {
    amount,
    merchant,
    currency: "PKR",
    channel,
    suggestedCategoryName: category,
    extractedIdentifier,
    providerHint,
    rawText: text,
  }
}

export const SAMPLE_SMS_TEMPLATES = [
  {
    id: "easypaisa",
    label: "Easypaisa (3737)",
    provider: "EASYPAISA",
    text: "You have paid Rs. 5,600.00 to OPENAI from Mobile Account 03001234567. Balance: Rs. 14,200.00. Trans ID: 1234567890",
  },
  {
    id: "jazzcash",
    label: "JazzCash (8558)",
    provider: "JAZZCASH",
    text: "Transaction of Rs. 1,450.00 paid to FOODPANDA via JazzCash Account 03011234567. Fee Rs. 0.00. TID: 987654321",
  },
  {
    id: "meezan",
    label: "Meezan Bank Card",
    provider: "MEEZAN_BANK",
    text: "Paid Rs. 5,600.00 at OPENAI using Meezan Visa Debit Card ending 4242 on 06-09-2026. Available Balance: PKR 88,400.00",
  },
  {
    id: "sadapay",
    label: "SadaPay",
    provider: "SADAPAY",
    text: "You just spent Rs. 599.00 at SPOTIFY with your SadaPay card ending 1122.",
  },
  {
    id: "hbl",
    label: "HBL Bank Card",
    provider: "HBL",
    text: "Dear Customer, your card ending in 9876 was used for PKR 8,200.00 at K-ELECTRIC on 06/09/2026.",
  },
]

