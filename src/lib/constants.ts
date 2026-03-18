export const DISCOUNT_TIERS = {
  SALES_VP_MAX: 30000,
  COO_MAX: 200000,
} as const

export const ROLE_LABELS: Record<string, string> = {
  sales_officer: 'Sales Officer',
  team_leader: 'Team Leader',
  branch_manager: 'Branch Manager',
  sales_vp: 'Sales VP',
  coo: 'COO',
  jmd: 'JMD',
  md: 'MD',
  admin: 'Admin',
}

export const TIER_LABELS: Record<string, string> = {
  sales_vp: 'Sales VP (≤₹30K)',
  coo: 'COO (₹30K–₹2L)',
  director: 'Director (>₹2L)',
}

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  escalated: 'bg-blue-100 text-blue-800',
}
