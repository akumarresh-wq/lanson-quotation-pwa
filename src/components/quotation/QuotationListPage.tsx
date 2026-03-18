import { useNavigate } from 'react-router-dom'
import { Plus, FileText } from 'lucide-react'
import { useQuotations } from '../../hooks/useQuotations'
import { formatDate, formatINR } from '../../lib/formatters'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'

export default function QuotationListPage() {
  const navigate = useNavigate()
  const { data: quotations, isLoading } = useQuotations()

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-900 mb-4">Quotations</h1>

      {!quotations || quotations.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Quotations"
          description="You haven't created any quotations yet"
          action={
            <button
              onClick={() => navigate('/quotations/new')}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Create Quotation
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {quotations.map((q) => (
            <button
              key={q.id}
              onClick={() => navigate(`/quotations/${q.id}`)}
              className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">{q.quotation_number}</span>
                <span className="text-xs text-gray-400">{formatDate(q.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 truncate">
                {q.variant?.model?.name} {q.variant?.name}
              </p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-500">{q.customer?.name}</span>
                <span className="text-sm font-semibold text-gray-900">{formatINR(q.on_road)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate('/quotations/new')}
        className="fixed bottom-24 right-4 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-colors"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
