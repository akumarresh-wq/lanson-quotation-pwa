import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Customer } from '../types/database'

export function useCustomers() {
  const { user } = useAuth()

  return useQuery<Customer[]>({
    queryKey: ['customers', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('3_disc_customers')
        .select('*')
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (input: { name: string; phone: string; email?: string }) => {
      const { data, error } = await supabase
        .from('3_disc_customers')
        .insert({
          ...input,
          created_by: profile!.id,
          branch_id: profile!.branch_id,
        })
        .select()
        .single()
      if (error) throw error
      return data as Customer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
