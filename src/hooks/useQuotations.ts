import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Quotation } from '../types/database'

export function useQuotations() {
  const { user } = useAuth()

  return useQuery<Quotation[]>({
    queryKey: ['quotations', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('3_disc_quotations')
        .select('*, variant:3_disc_vehicle_variants(*, model:3_disc_vehicle_models(*)), customer:3_disc_customers(*)')
        .order('created_at', { ascending: false })
        .limit(50)
      return (data ?? []) as Quotation[]
    },
  })
}

export function useCreateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Omit<Quotation, 'id' | 'quotation_number' | 'shared_via_whatsapp' | 'created_at' | 'variant' | 'customer'>) => {
      const { data, error } = await supabase
        .from('3_disc_quotations')
        .insert(input)
        .select('*, variant:3_disc_vehicle_variants(*, model:3_disc_vehicle_models(*)), customer:3_disc_customers(*)')
        .single()
      if (error) throw error
      return data as Quotation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}
