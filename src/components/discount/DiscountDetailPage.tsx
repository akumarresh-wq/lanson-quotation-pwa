import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, MessageCircle, FileText, Loader2 } from 'lucide-react'
import { useDiscountRequest, useApprovalLog, useProcessApproval } from '../../hooks/useDiscountRequests'
import { useAuth } from '../../context/AuthContext'
import { formatINR, formatDateTime, formatDate } from '../../lib/formatters'
import { discountNotifyMessage } from '../../lib/whatsapp'
import StatusBadge from '../common/StatusBadge'
import LoadingSpinner from '../common/LoadingSpinner'

export default function DiscountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: request, isLoading } = useDiscountRequest(id)
  const { data: approvalLog } = useApprovalLog(id)
  const processApproval = useProcessApproval()

  const [showApproveForm, setShowApproveForm] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [approvedAmount, setApprovedAmount] = useState(0)
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isLoading) return <LoadingSpinner />
  if (!request) return <div className="p-4 text-center text-gray-500">Request not found</div>

  const isAssignedApprover = profile?.id === request.assigned_to && request.status === 'pending'
  const isRequestor = profile?.id === request.requested_by

  async function handleApprove() {
    if (!profile || !id) return
    setError(null)
    try {
      await processApproval.mutateAsync({
        request_id: id,
        action: 'approved',
        actor_id: profile.id,
        remarks: remarks || undefined,
        approved_amount: approvedAmount || request!.discount_amount,
      })
      setShowApproveForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Approval failed')
    }
  }

  async function handleReject() {
    if (!profile || !id || !remarks.trim()) {
      setError('Remarks are required for rejection')
      return
    }
    setError(null)
    try {
      await processApproval.mutateAsync({
        request_id: id,
        action: 'rejected',
        actor_id: profile.id,
        remarks,
      })
      setShowRejectForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Rejection failed')
    }
  }

  function handleNotifyApprover() {
    const message = discountNotifyMessage(request!)
    if (request?.approver?.phone) {
      window.open(`https://wa.me/91${request.approver.phone}?text=${encodeURIComponent(message)}`, '_blank')
    } else {
      if (navigator.share) {
        navigator.share({ text: message }).catch(() => {})
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
      }
    }
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{request.request_number}</h1>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Vehicle Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Vehicle</h3>
        <p className="text-base font-semibold text-gray-900">
          {request.variant?.model?.name} {request.variant?.name}
        </p>
        <p className="text-sm text-gray-500 mt-1">On-Road: {formatINR(request.on_road_price)}</p>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</h3>
        <p className="text-base font-semibold text-gray-900">{request.customer?.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">{request.customer?.phone}</p>
      </div>

      {/* Discount Amount */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Discount</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Requested</p>
            <p className="text-lg font-bold text-red-600">{formatINR(request.discount_amount)}</p>
          </div>
          {request.approved_amount != null && request.approved_amount !== request.discount_amount && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-lg font-bold text-green-600">{formatINR(request.approved_amount)}</p>
            </div>
          )}
        </div>
        {request.remarks && (
          <p className="text-sm text-gray-600 mt-2 italic">"{request.remarks}"</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          Requested by {request.requestor?.full_name} on {formatDate(request.created_at)}
        </p>
      </div>

      {/* Approval Timeline */}
      {approvalLog && approvalLog.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Approval Timeline</h3>
          <div className="space-y-3">
            {approvalLog.map((entry, idx) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      entry.action === 'approved'
                        ? 'bg-green-100 text-green-600'
                        : entry.action === 'rejected'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {entry.action === 'approved' ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : entry.action === 'rejected' ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  {idx < approvalLog.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pb-3">
                  <p className="text-sm font-medium text-gray-900 capitalize">{entry.action}</p>
                  <p className="text-xs text-gray-500">{entry.actor?.full_name}</p>
                  {entry.remarks && (
                    <p className="text-xs text-gray-600 mt-1 italic">"{entry.remarks}"</p>
                  )}
                  {entry.approved_amount && (
                    <p className="text-xs text-green-600 mt-0.5">Amount: {formatINR(entry.approved_amount)}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(entry.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 mb-3">{error}</div>
      )}

      {/* Approver Actions */}
      {isAssignedApprover && !showApproveForm && !showRejectForm && (
        <div className="flex gap-3 mb-3">
          <button
            onClick={() => {
              setApprovedAmount(request.discount_amount)
              setRemarks('')
              setShowApproveForm(true)
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-white font-medium hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </button>
          <button
            onClick={() => {
              setRemarks('')
              setShowRejectForm(true)
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-white font-medium hover:bg-red-700"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
      )}

      {/* Approve Form */}
      {showApproveForm && (
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-4 mb-3 space-y-3">
          <h3 className="text-sm font-semibold text-green-800">Approve Discount</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approved Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">&#8377;</span>
              <input
                type="number"
                inputMode="numeric"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowApproveForm(false)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={processApproval.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {processApproval.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Reject Form */}
      {showRejectForm && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 mb-3 space-y-3">
          <h3 className="text-sm font-semibold text-red-800">Reject Discount</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (required)</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectForm(false)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={processApproval.isPending || !remarks.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {processApproval.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Rejection
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Notify */}
      {request.status === 'pending' && isRequestor && (
        <button
          onClick={handleNotifyApprover}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-500 hover:bg-green-600 px-4 py-2.5 text-white font-medium mb-3"
        >
          <MessageCircle className="h-4 w-4" />
          Notify Approver via WhatsApp
        </button>
      )}

      {/* Create Quotation */}
      {request.status === 'approved' && isRequestor && (
        <button
          onClick={() => navigate('/quotations/new', { state: { discountRequest: request } })}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2.5 text-white font-medium"
        >
          <FileText className="h-4 w-4" />
          Create Quotation
        </button>
      )}
    </div>
  )
}
