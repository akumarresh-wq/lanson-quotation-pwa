import { useNavigate } from 'react-router-dom'
import { Users, FileText, Bell, Settings, Shield, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABELS } from '../lib/constants'
import { canManageUsers } from '../lib/roles'

export default function MorePage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile ? canManageUsers(profile.role) : false

  const menuItems = [
    { icon: Users, label: 'Customers', to: '/customers', color: 'bg-blue-50 text-blue-600' },
    { icon: FileText, label: 'Quotations', to: '/quotations', color: 'bg-green-50 text-green-600' },
    { icon: Bell, label: 'Notifications', to: '/notifications', color: 'bg-orange-50 text-orange-600' },
    { icon: Settings, label: 'Settings', to: '#', color: 'bg-gray-100 text-gray-600' },
    ...(isAdmin ? [{ icon: Shield, label: 'Admin', to: '/admin', color: 'bg-purple-50 text-purple-600' }] : []),
  ]

  return (
    <div className="px-4 py-6">
      {/* Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-lg font-semibold">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">{profile?.full_name}</p>
            <p className="text-sm text-gray-500">{ROLE_LABELS[profile?.role ?? ''] ?? profile?.role}</p>
            {profile?.branch && (
              <p className="text-xs text-gray-400">{profile.branch.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {menuItems.map(({ icon: Icon, label, to, color }) => (
          <button
            key={label}
            onClick={() => to !== '#' && navigate(to)}
            disabled={to === '#'}
            className="flex flex-col items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </button>
        ))}
      </div>

      {/* Sign Out */}
      <button
        onClick={async () => {
          await signOut()
          navigate('/login')
        }}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  )
}
