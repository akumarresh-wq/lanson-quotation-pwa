import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ReceiptText } from 'lucide-react'
import { useDiscountRequests } from '../../hooks/useDiscountRequests'
import { formatDate, formatINR } from '../../lib/formatters'
import StatusBadge from '../common/StatusBadge'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
] as const

export default function DiscountListPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('all')
  const { data: allRequests, isLoading } = useDiscountRequests()

  // Client-side filter
  const requests = activeTab === 'all'
    ? allRequests
    : allRequests?.filter((r) => r.status === activeTab)

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-900 mb-4">Discount Requests</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Request List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !requests || requests.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No Requests"
          description={activeTab === 'all' ? 'No discount requests yet' : `No ${activeTab} requests`}
          action={
            <button
              onClick={() => navigate('/discounts/new')}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Create Request
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <button
              key={req.id}
              onClick={() => navigate(`/discounts/${req.id}`)}
              className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-900">{req.request_number}</span>
                <StatusBadge status={req.status} />
              </div>
              <p className="text-sm text-gray-700 truncate">
                {req.variant?.model?.name} {req.variant?.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {req.customer?.name}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                <span className="text-sm font-semibold text-red-600">{formatINR(req.discount_amount)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate('/discounts/new')}
        className="fixed bottom-24 right-4 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-colors"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
