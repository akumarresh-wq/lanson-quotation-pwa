import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { PriceList, PriceListItem, VehicleModel } from '../types/database'

export function useActivePriceList() {
  return useQuery<PriceList | null>({
    queryKey: ['active-price-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('1_dm_price_lists')
        .select('*')
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
        .limit(1)
        .single()
      return data
    },
  })
}

export function usePriceListItems(priceListId: string | undefined) {
  return useQuery<PriceListItem[]>({
    queryKey: ['price-list-items', priceListId],
    enabled: !!priceListId,
    queryFn: async () => {
      const { data } = await supabase
        .from('1_dm_price_list_items')
        .select('*, variant:1_dm_vehicle_variants(*, model:1_dm_vehicle_models(*))')
        .eq('price_list_id', priceListId!)
      // Sort client-side by model display_order then variant name
      const items = (data ?? []) as PriceListItem[]
      items.sort((a, b) => {
        const orderA = a.variant?.model?.display_order ?? 999
        const orderB = b.variant?.model?.display_order ?? 999
        if (orderA !== orderB) return orderA - orderB
        return (a.variant?.name ?? '').localeCompare(b.variant?.name ?? '')
      })
      return items
    },
  })
}

export function useVehicleModels() {
  return useQuery<VehicleModel[]>({
    queryKey: ['vehicle-models'],
    queryFn: async () => {
      const { data } = await supabase
        .from('1_dm_vehicle_models')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
      return data ?? []
    },
  })
}
