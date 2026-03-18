import type { UserRole } from '../types/database'

// Roles that can approve discount requests
export const APPROVER_ROLES: UserRole[] = ['sales_vp', 'coo', 'jmd', 'md']

// Roles that can view all requests (not just their own)
export const MANAGER_ROLES: UserRole[] = ['team_leader', 'branch_manager', 'sales_vp', 'coo', 'jmd', 'md', 'admin']

export function canApprove(role: UserRole): boolean {
  return APPROVER_ROLES.includes(role)
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin'
}

export function canUploadPriceList(role: UserRole): boolean {
  return role === 'admin'
}

export function canViewAllBranches(role: UserRole): boolean {
  return ['sales_vp', 'coo', 'jmd', 'md', 'admin'].includes(role)
}

export function canViewBranchRequests(role: UserRole): boolean {
  return MANAGER_ROLES.includes(role)
}
