import type { RequestStatus } from '../../types/database'
import { STATUS_COLORS } from '../../lib/constants'

interface StatusBadgeProps {
  status: RequestStatus
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  escalated: 'Escalated',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
