import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useQuotations } from '../../hooks/useQuotations'
import { useAuth } from '../../context/AuthContext'
import { formatINR, formatDate } from '../../lib/formatters'
import { quotationMessage } from '../../lib/whatsapp'
import PriceRow from '../common/PriceRow'
import LoadingSpinner from '../common/LoadingSpinner'

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: quotations, isLoading } = useQuotations()

  const quotation = quotations?.find((q) => q.id === id)

  if (isLoading) return <LoadingSpinner />
  if (!quotation) return <div className="p-4 text-center text-gray-500">Quotation not found</div>

  function handleShare() {
    if (!quotation || !profile) return
    const message = quotationMessage(quotation, profile)

    if (quotation.customer?.phone) {
      window.open(`https://wa.me/91${quotation.customer.phone}?text=${encodeURIComponent(message)}`, '_blank')
    } else if (navigator.share) {
      navigator.share({ text: message }).catch(() => {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
      })
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    }
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{quotation.quotation_number}</h1>
          <p className="text-xs text-gray-500">{formatDate(quotation.created_at)}</p>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Vehicle</h3>
        <p className="text-base font-semibold text-gray-900">
          {quotation.variant?.model?.name} {quotation.variant?.name}
        </p>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</h3>
        <p className="text-base font-semibold text-gray-900">{quotation.customer?.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">{quotation.customer?.phone}</p>
      </div>

      {/* Price Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Price Breakdown</h3>
        <PriceRow label="Ex-Showroom" amount={quotation.ex_showroom} />
        {quotation.gst > 0 && <PriceRow label="GST" amount={quotation.gst} />}
        {quotation.tcs > 0 && <PriceRow label="TCS" amount={quotation.tcs} />}
        {quotation.insurance > 0 && <PriceRow label="Insurance" amount={quotation.insurance} />}
        {quotation.rto > 0 && <PriceRow label="RTO" amount={quotation.rto} />}
        {quotation.fastag > 0 && <PriceRow label="FASTag" amount={quotation.fastag} />}
        {quotation.accessories > 0 && <PriceRow label="Accessories" amount={quotation.accessories} />}
        {quotation.discount > 0 && (
          <div className="flex items-center justify-between py-1.5 text-green-600">
            <span className="text-sm">Discount</span>
            <span className="text-sm">-{formatINR(quotation.discount)}</span>
          </div>
        )}
        <div className="mt-1 pt-1 border-t border-gray-200">
          <PriceRow label="On-Road Price" amount={quotation.on_road} highlight />
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-500 hover:bg-green-600 px-4 py-3 text-white font-medium transition-colors"
      >
        <MessageCircle className="h-5 w-5" />
        Share via WhatsApp
      </button>
    </div>
  )
}
