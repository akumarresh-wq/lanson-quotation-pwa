import { useNavigate } from 'react-router-dom'
import { Share2, Percent, FileText, ClipboardCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useDiscountRequests } from '../../hooks/useDiscountRequests'
import { ROLE_LABELS } from '../../lib/constants'
import { canApprove } from '../../lib/roles'
import { formatDate, formatINR } from '../../lib/formatters'
import StatusBadge from '../common/StatusBadge'
import LoadingSpinner from '../common/LoadingSpinner'

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { data: requests, isLoading } = useDiscountRequests()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'User'
  const isApprover = profile ? canApprove(profile.role) : false
  const pendingCount = requests?.filter((r) => r.status === 'pending').length ?? 0
  const recentRequests = requests?.slice(0, 5) ?? []

  return (
    <div className="px-4 py-6">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hi, {firstName}</h1>
        <span className="inline-flex items-center mt-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
          {ROLE_LABELS[profile?.role ?? ''] ?? profile?.role}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/prices')}
            className="flex flex-col items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Share2 className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Share Price List</span>
          </button>

          <button
            onClick={() => navigate('/discounts/new')}
            className="flex flex-col items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <Percent className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Request Discount</span>
          </button>

          <button
            onClick={() => navigate('/quotations/new')}
            className="flex flex-col items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">New Quotation</span>
          </button>

          {isApprover && (
            <button
              onClick={() => navigate('/discounts')}
              className="flex flex-col items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow relative"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Pending Approvals</span>
              {pendingCount > 0 && (
                <span className="absolute top-2 right-2 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Activity</h2>
        {isLoading ? (
          <LoadingSpinner />
        ) : recentRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-sm text-gray-500">No recent discount requests</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentRequests.map((req) => (
              <button
                key={req.id}
                onClick={() => navigate(`/discounts/${req.id}`)}
                className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">{req.request_number}</span>
                  <StatusBadge status={req.status} />
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {req.variant?.model?.name} {req.variant?.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                  <span className="text-sm font-medium text-gray-700">{formatINR(req.discount_amount)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
