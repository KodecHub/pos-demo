import type { ReactNode } from "react"

export type FeatureKey =
  | "qrOrdering"
  | "staffHr"
  | "attendance"
  | "crm"
  | "multiBranch"

export type FeatureConfig = {
  key: FeatureKey
  label: string
  description: string
  upgradeMessage: string
  recommendedPlan?: string
  priceHint?: string
  isEnabled: boolean
  benefits?: ReactNode
}

export const featureConfigs: Record<FeatureKey, FeatureConfig> = {
  qrOrdering: {
    key: "qrOrdering",
    label: "QR Ordering",
    description: "Let guests scan a QR code to browse the menu and place orders from their phones.",
    upgradeMessage: "Enable QR ordering to reduce wait times and improve table turnover.",
    recommendedPlan: "Growth",
    priceHint: "Included from Growth plan upwards.",
    isEnabled: false,
  },
  staffHr: {
    key: "staffHr",
    label: "Staff & HR",
    description: "Manage staff, roles, payroll insights, and upcoming shifts in one place.",
    upgradeMessage: "Unlock HR tools to keep your team organized and payroll under control.",
    recommendedPlan: "Pro",
    priceHint: "Best for restaurants with 10+ staff.",
    isEnabled: true,
  },
  attendance: {
    key: "attendance",
    label: "Attendance",
    description: "Track check-in/check-out times, late arrivals, and leave requests.",
    upgradeMessage: "Use attendance tracking to get clear visibility into staffing and coverage.",
    recommendedPlan: "Pro",
    priceHint: "Included with Pro plan.",
    isEnabled: true,
  },
  crm: {
    key: "crm",
    label: "CRM",
    description: "Store customer details, visits, and loyalty tiers to drive repeat business.",
    upgradeMessage: "Unlock CRM to run campaigns and build loyalty with your best customers.",
    recommendedPlan: "Growth",
    priceHint: "Included from Growth plan upwards.",
    isEnabled: false,
  },
  multiBranch: {
    key: "multiBranch",
    label: "Multi-Branch",
    description: "Manage multiple locations with branch-level revenue and performance.",
    upgradeMessage: "Enable multi-branch to manage all locations from a single POS account.",
    recommendedPlan: "Pro",
    priceHint: "Designed for multi-location groups.",
    isEnabled: false,
  },
}

