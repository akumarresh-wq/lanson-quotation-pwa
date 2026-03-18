import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, UserPlus, Users, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCustomers, useCreateCustomer } from '../../hooks/useCustomers'
import { customerSchema, type CustomerInput } from '../../lib/validators'
import { formatDate } from '../../lib/formatters'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'

export default function CustomerListPage() {
  const navigate = useNavigate()
  const { data: customers, isLoading } = useCustomers()
  const createCustomer = useCreateCustomer()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', email: '' },
  })

  const filtered = search.trim()
    ? customers?.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search)
      )
    : customers

  async function handleCreate(data: CustomerInput) {
    setError(null)
    try {
      await createCustomer.mutateAsync(data)
      form.reset()
      setShowAdd(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add customer')
    }
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Customers</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <UserPlus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* Add Customer Form */}
      {showAdd && (
        <form onSubmit={form.handleSubmit(handleCreate)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              placeholder="Customer name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              {...form.register('phone')}
            />
            {form.formState.errors.phone && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.phone.message}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowAdd(false); form.reset() }}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCustomer.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {createCustomer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      {/* Customer List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Customers"
          description={search ? `No customers matching "${search}"` : 'Add your first customer to get started'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
            >
              <p className="text-sm font-semibold text-gray-900">{c.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{c.phone}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(c.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
