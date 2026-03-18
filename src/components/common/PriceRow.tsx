import { formatINR } from '../../lib/formatters'

interface PriceRowProps {
  label: string
  amount: number
  highlight?: boolean
}

export default function PriceRow({ label, amount, highlight }: PriceRowProps) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${highlight ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
      <span className={highlight ? 'text-base' : 'text-sm'}>{label}</span>
      <span className={highlight ? 'text-base' : 'text-sm'}>{formatINR(amount)}</span>
    </div>
  )
}
