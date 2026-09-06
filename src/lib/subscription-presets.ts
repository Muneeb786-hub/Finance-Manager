export interface SubscriptionPreset {
  id: string
  name: string
  subcategory: string
  defaultAmount: number
  frequency: "MONTHLY" | "YEARLY"
  icon: string
  color: string
  description: string
}

export const SUBSCRIPTION_SUBCATEGORIES = [
  { id: "AI", label: "AI & Tools", color: "#8b5cf6", icon: "Bot" },
  { id: "Entertainment", label: "Entertainment & Music", color: "#ec4899", icon: "Tv" },
  { id: "Cloud", label: "Cloud & Storage", color: "#06b6d4", icon: "Cloud" },
  { id: "Productivity", label: "Work & Productivity", color: "#3b82f6", icon: "Briefcase" },
  { id: "Gaming", label: "Gaming", color: "#10b981", icon: "Gamepad2" },
  { id: "Lifestyle", label: "Health & Lifestyle", color: "#f97316", icon: "Heart" },
  { id: "Other", label: "Other", color: "#64748b", icon: "Tag" },
] as const

export const POPULAR_SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  // AI Tools
  {
    id: "chatgpt",
    name: "ChatGPT Plus",
    subcategory: "AI",
    defaultAmount: 20.0,
    frequency: "MONTHLY",
    icon: "Bot",
    color: "#10a37f",
    description: "OpenAI GPT-4o & advanced data analysis",
  },
  {
    id: "claude",
    name: "Claude Pro",
    subcategory: "AI",
    defaultAmount: 20.0,
    frequency: "MONTHLY",
    icon: "Sparkles",
    color: "#d97706",
    description: "Anthropic Claude 3.5 Sonnet priority access",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    subcategory: "AI",
    defaultAmount: 10.0,
    frequency: "MONTHLY",
    icon: "Code2",
    color: "#4f46e5",
    description: "AI pair programmer and code completion",
  },
  {
    id: "cursor",
    name: "Cursor Pro",
    subcategory: "AI",
    defaultAmount: 20.0,
    frequency: "MONTHLY",
    icon: "Terminal",
    color: "#6366f1",
    description: "AI-first code editor subscription",
  },

  // Entertainment / Music / Streaming
  {
    id: "spotify",
    name: "Spotify Premium",
    subcategory: "Entertainment",
    defaultAmount: 11.99,
    frequency: "MONTHLY",
    icon: "Music",
    color: "#1db954",
    description: "Ad-free music and podcast streaming",
  },
  {
    id: "youtube",
    name: "YouTube Premium",
    subcategory: "Entertainment",
    defaultAmount: 13.99,
    frequency: "MONTHLY",
    icon: "Video",
    color: "#ff0000",
    description: "Ad-free videos, background play, and YouTube Music",
  },
  {
    id: "netflix",
    name: "Netflix Standard",
    subcategory: "Entertainment",
    defaultAmount: 15.49,
    frequency: "MONTHLY",
    icon: "Tv",
    color: "#e50914",
    description: "HD movies, series, and mobile games",
  },
  {
    id: "apple-music",
    name: "Apple Music",
    subcategory: "Entertainment",
    defaultAmount: 10.99,
    frequency: "MONTHLY",
    icon: "Headphones",
    color: "#fc3c44",
    description: "Lossless spatial audio music library",
  },

  // Cloud & Storage
  {
    id: "google-one",
    name: "Google One (100GB)",
    subcategory: "Cloud",
    defaultAmount: 2.99,
    frequency: "MONTHLY",
    icon: "Cloud",
    color: "#4285f4",
    description: "Google Drive, Photos, and Gmail expanded storage",
  },
  {
    id: "icloud",
    name: "Apple iCloud+ (50GB)",
    subcategory: "Cloud",
    defaultAmount: 0.99,
    frequency: "MONTHLY",
    icon: "Cloud",
    color: "#0071e3",
    description: "Apple cloud backup and Private Relay",
  },

  // Productivity
  {
    id: "microsoft-365",
    name: "Microsoft 365 Personal",
    subcategory: "Productivity",
    defaultAmount: 9.99,
    frequency: "MONTHLY",
    icon: "FileSpreadsheet",
    color: "#d83b01",
    description: "Office apps and 1TB OneDrive cloud storage",
  },
  {
    id: "notion",
    name: "Notion Plus",
    subcategory: "Productivity",
    defaultAmount: 10.0,
    frequency: "MONTHLY",
    icon: "FileText",
    color: "#000000",
    description: "Connected workspace and unlimited file uploads",
  },

  // Gaming & Lifestyle
  {
    id: "ps-plus",
    name: "PlayStation Plus Essential",
    subcategory: "Gaming",
    defaultAmount: 9.99,
    frequency: "MONTHLY",
    icon: "Gamepad2",
    color: "#003791",
    description: "Monthly games and online multiplayer",
  },
  {
    id: "gym",
    name: "Fitness Gym Membership",
    subcategory: "Lifestyle",
    defaultAmount: 45.0,
    frequency: "MONTHLY",
    icon: "Dumbbell",
    color: "#f59e0b",
    description: "Local gym pass and workout facility access",
  },
]

export function getSubcategoryMeta(subcat?: string | null) {
  const found = SUBSCRIPTION_SUBCATEGORIES.find(
    (s) => s.id.toLowerCase() === (subcat || "").toLowerCase()
  )
  return found || { id: "Other", label: subcat || "Other", color: "#64748b", icon: "Tag" }
}
