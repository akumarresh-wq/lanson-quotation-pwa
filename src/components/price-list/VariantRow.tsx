import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { PriceListItem } from '../../types/database'
import { formatINR, fuelLabel, transmissionLabel } from '../../lib/formatters'
import PriceRow from '../common/PriceRow'

interface VariantRowProps {
  item: PriceListItem
}

export default function VariantRow({ item }: VariantRowProps) {
  const [expanded, setExpanded] = useState(false)
  const variant = item.variant

  return (
    <div className="border-t border-gray-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between py-3 px-1 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{variant?.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {variant?.fuel && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                {fuelLabel(variant.fuel)}
              </span>
            )}
            {variant?.transmission && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                {transmissionLabel(variant.transmission)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-gray-400">On-Road</p>
            <p className="text-sm font-semibold text-gray-900">{formatINR(item.on_road)}</p>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-1 pb-3 border-t border-gray-50 pt-2">
          <PriceRow label="Ex-Showroom" amount={item.ex_showroom} />
          {item.gst > 0 && <PriceRow label="GST" amount={item.gst} />}
          {item.tcs > 0 && <PriceRow label="TCS" amount={item.tcs} />}
          {item.insurance > 0 && <PriceRow label="Insurance" amount={item.insurance} />}
          {item.rto > 0 && <PriceRow label="RTO" amount={item.rto} />}
          {item.fastag > 0 && <PriceRow label="FASTag" amount={item.fastag} />}
          {item.accessories > 0 && <PriceRow label="Accessories" amount={item.accessories} />}
          <div className="mt-1 pt-1 border-t border-gray-200">
            <PriceRow label="On-Road Price" amount={item.on_road} highlight />
          </div>
        </div>
      )}
    </div>
  )
}
