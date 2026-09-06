export interface ParsedBankAlert {
  amount: number
  merchant: string
  currency: string
  channel: "EASYPAISA" | "JAZZCASH" | "CARD" | "BANK"
  suggestedCategoryName: string
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
 * - Easypaisa (3737): "You have sent Rs. 5,600 to OPENAI from your Easypaisa Mobile Account..."
 * - Credit/Debit Card: "Dear Customer, transaction of Rs 5,600.00 carried out on your Card ending 4242 at OPENAI..."
 * - Bank Account / Meezan: "Paid Rs. 1450.00 at FOODPANDA using Meezan Card ending 1234..."
 */
export function parseBankAlert(text: string): ParsedBankAlert {
  const normalized = text.replace(/,/g, "")

  // Detect channel
  let channel: "EASYPAISA" | "JAZZCASH" | "CARD" | "BANK" = "CARD"
  if (/easypaisa|3737/i.test(text)) {
    channel = "EASYPAISA"
  } else if (/jazzcash|8558/i.test(text)) {
    channel = "JAZZCASH"
  } else if (/bank|meezan|hbl|alfalah|standard chartered|mcb|ubl/i.test(text)) {
    channel = "BANK"
  } else if (/card|visa|mastercard/i.test(text)) {
    channel = "CARD"
  }

  // Extract amount
  // Matches: Rs. 5600, Rs 5600.00, PKR 5600, $20.00, 5600.00 PKR
  const amountMatch = normalized.match(/(?:rs\.?|pkr|\$)\s*([\d]+(?:\.\d{1,2})?)/i) ||
    normalized.match(/([\d]+(?:\.\d{1,2})?)\s*(?:rs|pkr)/i)

  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0

  // Extract merchant
  // Matches: "at OPENAI", "to OPENAI", "paid at OPENAI", "from OPENAI"
  let merchantCandidate = ""
  const merchantMatch =
    text.match(/(?:at|to|towards|for)\s+([A-Za-z0-9\s&.-]+?)(?:\s+(?:on|from|using|via|fee|balance|ref|trx|with|\.))/i) ||
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
    rawText: text,
  }
}
