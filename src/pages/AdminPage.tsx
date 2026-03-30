import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Loader2, Users, UserPlus, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { canManageUsers } from '../lib/roles'
import { ROLE_LABELS } from '../lib/constants'
import { supabase } from '../lib/supabase'
import type { UserRole, Branch } from '../types/database'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useQuery, useQueryClient } from '@tanstack/react-query'

function useAdminProfiles() {
  return useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('3_disc_profiles')
        .select('*, branch:3_disc_branches(*)')
        .order('full_name')
      if (error) throw error
      return data ?? []
    },
  })
}

function useAdminBranches() {
  return useQuery<Branch[]>({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('3_disc_branches')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return (data ?? []) as Branch[]
    },
  })
}

const ALL_ROLES: UserRole[] = ['sales_officer', 'team_leader', 'branch_manager', 'sales_vp', 'coo', 'jmd', 'md', 'admin']

export default function AdminPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: profiles, isLoading: loadingProfiles } = useAdminProfiles()
  const { data: branches } = useAdminBranches()

  // Price list upload state
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  // User management state
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Create user state
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({
    full_name: '',
    lm_number: '',
    phone: '',
    pin: '',
    role: 'sales_officer' as UserRole,
    branch_id: '',
  })
  const [creating, setCreating] = useState(false)
  const [createMessage, setCreateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!profile || !canManageUsers(profile.role)) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-gray-500">You do not have access to this page.</p>
      </div>
    )
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setUploadMessage(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-price-list`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token}` },
          body: formData,
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }
      setUploadMessage('Price list uploaded successfully!')
      setFile(null)
    } catch (err: unknown) {
      setUploadMessage(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingId(userId)
    await supabase.from('3_disc_profiles').update({ role: newRole }).eq('id', userId)
    queryClient.invalidateQueries({ queryKey: ['admin-profiles'] })
    setUpdatingId(null)
  }

  async function handleBranchChange(userId: string, branchId: string | null) {
    setUpdatingId(userId)
    await supabase.from('3_disc_profiles').update({ branch_id: branchId || null }).eq('id', userId)
    queryClient.invalidateQueries({ queryKey: ['admin-profiles'] })
    setUpdatingId(null)
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateMessage(null)

    const email = `${newUser.full_name.toLowerCase().replace(/\s+/g, '')}${newUser.lm_number}@lanson.com`

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            pin: newUser.pin,
            full_name: newUser.full_name,
            phone: newUser.phone,
            role: newUser.role,
            branch_id: newUser.branch_id || null,
            lm_number: newUser.lm_number,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create user')

      setCreateMessage({ type: 'success', text: `User created: ${email}` })
      setNewUser({ full_name: '', lm_number: '', phone: '', pin: '', role: 'sales_officer', branch_id: '' })
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] })
    } catch (err: unknown) {
      setCreateMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create user' })
    } finally {
      setCreating(false)
    }
  }

  const generatedEmail = newUser.full_name && newUser.lm_number
    ? `${newUser.full_name.toLowerCase().replace(/\s+/g, '')}${newUser.lm_number}@lanson.com`
    : ''

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      {/* Create User */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <button
          onClick={() => setShowCreateUser(!showCreateUser)}
          className="w-full flex items-center justify-between"
        >
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-gray-500" />
            Create New User
          </h2>
          <span className="text-xs text-red-600 font-medium">{showCreateUser ? 'Hide' : 'Show'}</span>
        </button>

        {showCreateUser && (
          <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={e => setNewUser(u => ({ ...u, full_name: e.target.value }))}
                  placeholder="Ravi Kumar"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">LM Number</label>
                <input
                  type="text"
                  value={newUser.lm_number}
                  onChange={e => setNewUser(u => ({ ...u, lm_number: e.target.value.replace(/\D/g, '') }))}
                  placeholder="1001"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {generatedEmail && (
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500">Login email</p>
                <p className="text-sm font-medium text-gray-900">{generatedEmail}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={newUser.phone}
                  onChange={e => setNewUser(u => ({ ...u, phone: e.target.value.replace(/\D/g, '') }))}
                  placeholder="9876543210"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">6-Digit PIN</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={newUser.pin}
                  onChange={e => setNewUser(u => ({ ...u, pin: e.target.value.replace(/\D/g, '') }))}
                  placeholder="123456"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser(u => ({ ...u, role: e.target.value as UserRole }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {ALL_ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
                <select
                  value={newUser.branch_id}
                  onChange={e => setNewUser(u => ({ ...u, branch_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">No Branch</option>
                  {branches?.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {createMessage && (
              <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
                createMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {createMessage.type === 'success' && <Check className="h-4 w-4" />}
                {createMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={creating || newUser.pin.length !== 6}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create User
            </button>
          </form>
        )}
      </div>

      {/* Upload Price List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <Upload className="h-4 w-4 text-gray-500" />
          Upload Price List
        </h2>
        <div className="space-y-3">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setUploadMessage(null)
            }}
            className="w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-red-700 hover:file:bg-red-100"
          />
          {file && (
            <p className="text-sm text-gray-600">
              Ready to upload <span className="font-medium">{file.name}</span>
            </p>
          )}
          {uploadMessage && (
            <div className={`rounded-lg p-3 text-sm ${uploadMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {uploadMessage}
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            Upload
          </button>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-gray-500" />
          User Management ({profiles?.length ?? 0} users)
        </h2>

        {loadingProfiles ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            {profiles?.map((p) => (
              <div key={p.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.full_name}</p>
                    <p className="text-xs text-gray-500">{p.phone} {p.lm_number ? `· LM ${p.lm_number}` : ''}</p>
                  </div>
                  {updatingId === p.id && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                </div>
                <div className="flex gap-2">
                  <select
                    value={p.role}
                    onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                    disabled={updatingId === p.id || p.id === profile.id}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <select
                    value={p.branch_id ?? ''}
                    onChange={(e) => handleBranchChange(p.id, e.target.value || null)}
                    disabled={updatingId === p.id}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <option value="">No Branch</option>
                    {branches?.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
