import { useMemo, useState } from 'react'
import { Search, ListX } from 'lucide-react'
import { useActivePriceList, usePriceListItems } from '../../hooks/usePriceList'
import { useAuth } from '../../context/AuthContext'
import { priceListMessage } from '../../lib/whatsapp'
import type { PriceListItem } from '../../types/database'
import ModelCard from './ModelCard'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'

export default function PriceListPage() {
  const { profile } = useAuth()
  const { data: priceList, isLoading: loadingPL } = useActivePriceList()
  const { data: items, isLoading: loadingItems } = usePriceListItems(priceList?.id)
  const [search, setSearch] = useState('')

  // Group items by model
  const grouped = useMemo(() => {
    if (!items) return new Map<string, PriceListItem[]>()
    const map = new Map<string, PriceListItem[]>()
    for (const item of items) {
      const modelName = item.variant?.model?.name ?? 'Unknown'
      const existing = map.get(modelName) ?? []
      existing.push(item)
      map.set(modelName, existing)
    }
    return map
  }, [items])

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return grouped
    const q = search.toLowerCase()
    const result = new Map<string, PriceListItem[]>()
    for (const [modelName, modelItems] of grouped) {
      if (modelName.toLowerCase().includes(q)) {
        result.set(modelName, modelItems)
      } else {
        const matching = modelItems.filter(
          (item) =>
            item.variant?.name?.toLowerCase().includes(q) ||
            item.variant?.fuel?.toLowerCase().includes(q) ||
            item.variant?.transmission?.toLowerCase().includes(q)
        )
        if (matching.length > 0) {
          result.set(modelName, matching)
        }
      }
    }
    return result
  }, [grouped, search])

  function handleShare(modelName: string, modelItems: PriceListItem[]) {
    if (!profile) return
    const message = priceListMessage(modelName, modelItems, profile)

    if (navigator.share) {
      navigator.share({ text: message }).catch(() => {
        // Fallback to WhatsApp
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
      })
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    }
  }

  if (loadingPL || loadingItems) return <LoadingSpinner />

  if (!priceList) {
    return (
      <EmptyState
        icon={ListX}
        title="No Active Price List"
        description="There is no active price list at the moment. Contact your admin to upload one."
      />
    )
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Price List</h1>
        <p className="text-sm text-gray-500">{priceList.title}</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search models or variants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      {/* Model Cards */}
      {filtered.size === 0 ? (
        <EmptyState
          icon={Search}
          title="No Results"
          description={`No models or variants match "${search}"`}
        />
      ) : (
        <div className="space-y-3">
          {Array.from(filtered.entries()).map(([modelName, modelItems]) => (
            <ModelCard
              key={modelName}
              modelName={modelName}
              items={modelItems}
              onShare={() => handleShare(modelName, modelItems)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
