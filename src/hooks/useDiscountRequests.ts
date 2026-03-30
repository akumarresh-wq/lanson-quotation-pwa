import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { canApprove, canViewBranchRequests } from '../lib/roles'
import type { DiscountRequest, ApprovalLogEntry } from '../types/database'

export function useDiscountRequests() {
  const { profile } = useAuth()

  return useQuery<DiscountRequest[]>({
    queryKey: ['discount-requests', profile?.id, profile?.role],
    enabled: !!profile,
    queryFn: async () => {
      let query = supabase
        .from('3_disc_discount_requests')
        .select('*, variant:3_disc_vehicle_variants(*, model:3_disc_vehicle_models(*)), customer:3_disc_customers(*), requestor:3_disc_profiles!requested_by(*), approver:3_disc_profiles!assigned_to(*)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!profile) return []

      // Approvers see requests assigned to them
      if (canApprove(profile.role)) {
        query = query.or(`assigned_to.eq.${profile.id},requested_by.eq.${profile.id}`)
      } else if (canViewBranchRequests(profile.role)) {
        // Branch managers/TLs see their branch
        // This relies on RLS for actual enforcement
        query = query // RLS handles filtering
      } else {
        // Sales officers see only their own
        query = query.eq('requested_by', profile.id)
      }

      const { data } = await query
      return (data ?? []) as DiscountRequest[]
    },
  })
}

export function useDiscountRequest(id: string | undefined) {
  return useQuery<DiscountRequest | null>({
    queryKey: ['discount-request', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from('3_disc_discount_requests')
        .select('*, variant:3_disc_vehicle_variants(*, model:3_disc_vehicle_models(*)), customer:3_disc_customers(*), requestor:3_disc_profiles!requested_by(*, branch:3_disc_branches(*)), approver:3_disc_profiles!assigned_to(*)')
        .eq('id', id!)
        .single()
      return data as DiscountRequest | null
    },
  })
}

export function useApprovalLog(requestId: string | undefined) {
  return useQuery<ApprovalLogEntry[]>({
    queryKey: ['approval-log', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data } = await supabase
        .from('3_disc_approval_log')
        .select('*, actor:3_disc_profiles(*)')
        .eq('request_id', requestId!)
        .order('created_at', { ascending: true })
      return (data ?? []) as ApprovalLogEntry[]
    },
  })
}

export function useCreateDiscountRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      variant_id: string
      customer_id: string
      discount_amount: number
      on_road_price: number
      remarks?: string
      requested_by: string
    }) => {
      const { data, error } = await supabase
        .from('3_disc_discount_requests')
        .insert(input)
        .select('*, variant:3_disc_vehicle_variants(*, model:3_disc_vehicle_models(*)), customer:3_disc_customers(*)')
        .single()
      if (error) throw error
      return data as DiscountRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-requests'] })
    },
  })
}

export function useProcessApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      request_id: string
      action: 'approved' | 'rejected'
      actor_id: string
      remarks?: string
      approved_amount?: number
    }) => {
      const { data, error } = await supabase.rpc('process_approval', {
        p_request_id: input.request_id,
        p_action: input.action,
        p_actor_id: input.actor_id,
        p_remarks: input.remarks ?? null,
        p_amount: input.approved_amount ?? null,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discount-requests'] })
      queryClient.invalidateQueries({ queryKey: ['discount-request', variables.request_id] })
      queryClient.invalidateQueries({ queryKey: ['approval-log', variables.request_id] })
    },
  })
}
