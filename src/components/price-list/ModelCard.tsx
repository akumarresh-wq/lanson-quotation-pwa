import { useState } from 'react'
import { ChevronDown, ChevronUp, Share2 } from 'lucide-react'
import type { PriceListItem } from '../../types/database'
import VariantRow from './VariantRow'

interface ModelCardProps {
  modelName: string
  items: PriceListItem[]
  onShare: () => void
}

export default function ModelCard({ modelName, items, onShare }: ModelCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div>
          <h3 className="text-base font-semibold text-gray-900">{modelName}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {items.length} variant{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onShare()
            }}
            className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
            title="Share via WhatsApp"
          >
            <Share2 className="h-4 w-4" />
          </button>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {items.map((item) => (
            <VariantRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
