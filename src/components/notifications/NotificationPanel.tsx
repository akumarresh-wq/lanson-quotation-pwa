import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCheck, Bell, Percent, FileText, Info } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { formatDateTime } from '../../lib/formatters'
import EmptyState from '../common/EmptyState'

function notificationIcon(type: string) {
  switch (type) {
    case 'discount_request':
    case 'discount_approved':
    case 'discount_rejected':
      return <Percent className="h-4 w-4" />
    case 'quotation':
      return <FileText className="h-4 w-4" />
    default:
      return <Info className="h-4 w-4" />
  }
}

function notificationIconBg(type: string) {
  switch (type) {
    case 'discount_approved':
      return 'bg-green-100 text-green-600'
    case 'discount_rejected':
      return 'bg-red-100 text-red-600'
    case 'discount_request':
      return 'bg-orange-100 text-orange-600'
    case 'quotation':
      return 'bg-blue-100 text-blue-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export default function NotificationPanel() {
  const navigate = useNavigate()
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications()

  async function handleTap(notification: typeof notifications[0]) {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    // Navigate to the related resource
    if (notification.reference_id && notification.type?.includes('discount')) {
      navigate(`/discounts/${notification.reference_id}`)
    } else if (notification.reference_id && notification.type?.includes('quotation')) {
      navigate(`/quotations/${notification.reference_id}`)
    }
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description="You're all caught up! Notifications will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleTap(n)}
              className={`w-full flex items-start gap-3 rounded-xl p-4 text-left transition-colors ${
                n.is_read
                  ? 'bg-white border border-gray-100'
                  : 'bg-red-50 border border-red-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${notificationIconBg(n.type)}`}>
                {notificationIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm truncate ${n.is_read ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                    {n.title}
                  </p>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
