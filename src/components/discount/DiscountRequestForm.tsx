import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Loader2, UserPlus } from 'lucide-react'
import { useVehicleModels, usePriceListItems, useActivePriceList } from '../../hooks/usePriceList'
import { useCustomers, useCreateCustomer } from '../../hooks/useCustomers'
import { useCreateDiscountRequest } from '../../hooks/useDiscountRequests'
import { useAuth } from '../../context/AuthContext'
import { discountRequestSchema, customerSchema, type DiscountRequestInput, type CustomerInput } from '../../lib/validators'
import { formatINR } from '../../lib/formatters'
import { DISCOUNT_TIERS, TIER_LABELS } from '../../lib/constants'
import type { PriceListItem } from '../../types/database'

export default function DiscountRequestForm() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [step, setStep] = useState(1)
  const [selectedModelId, setSelectedModelId] = useState('')
  const [selectedItem, setSelectedItem] = useState<PriceListItem | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: models } = useVehicleModels()
  const { data: priceList } = useActivePriceList()
  const { data: allItems } = usePriceListItems(priceList?.id)
  const { data: customers } = useCustomers()
  const createCustomer = useCreateCustomer()
  const createRequest = useCreateDiscountRequest()

  // Filter items by selected model
  const modelItems = allItems?.filter((item) => item.variant?.model?.id === selectedModelId) ?? []

  const customerForm = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', email: '' },
  })

  const discountForm = useForm<{ discount_amount: number; remarks: string }>({
    defaultValues: { discount_amount: 0, remarks: '' },
  })

  const discountAmount = discountForm.watch('discount_amount')

  function getApprovalTier(amount: number): string {
    if (amount <= DISCOUNT_TIERS.SALES_VP_MAX) return 'sales_vp'
    if (amount <= DISCOUNT_TIERS.COO_MAX) return 'coo'
    return 'director'
  }

  async function handleCreateCustomer(data: CustomerInput) {
    try {
      const customer = await createCustomer.mutateAsync(data)
      setSelectedCustomerId(customer.id)
      setShowNewCustomer(false)
      customerForm.reset()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create customer')
    }
  }

  async function handleSubmit() {
    if (!selectedItem || !selectedCustomerId || !profile) return
    setError(null)

    const amount = discountForm.getValues('discount_amount')
    const remarks = discountForm.getValues('remarks')

    if (!amount || amount <= 0) {
      setError('Enter a valid discount amount')
      return
    }

    const input: DiscountRequestInput = {
      variant_id: selectedItem.variant_id,
      customer_id: selectedCustomerId,
      discount_amount: amount,
      on_road_price: selectedItem.on_road,
      remarks: remarks || undefined,
    }

    try {
      discountRequestSchema.parse(input)
      const result = await createRequest.mutateAsync({
        ...input,
        requested_by: profile.id,
      } as Parameters<typeof createRequest.mutateAsync>[0])
      navigate(`/discounts/${result.id}`, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    }
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Request Discount</h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? 'bg-red-600 text-white'
                  : s < step
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-red-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 mb-4">{error}</div>
      )}

      {/* Step 1: Vehicle Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Model</label>
            <select
              value={selectedModelId}
              onChange={(e) => {
                setSelectedModelId(e.target.value)
                setSelectedItem(null)
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a model</option>
              {models?.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {selectedModelId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Variant</label>
              <select
                value={selectedItem?.variant_id ?? ''}
                onChange={(e) => {
                  const item = modelItems.find((i) => i.variant_id === e.target.value)
                  setSelectedItem(item ?? null)
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select a variant</option>
                {modelItems.map((item) => (
                  <option key={item.variant_id} value={item.variant_id}>
                    {item.variant?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedItem && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">On-Road Price</p>
              <p className="text-lg font-bold text-gray-900">{formatINR(selectedItem.on_road)}</p>
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            disabled={!selectedItem}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: Customer Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a customer</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowNewCustomer(!showNewCustomer)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
            >
              <UserPlus className="h-4 w-4" />
              {showNewCustomer ? 'Cancel' : 'Add New Customer'}
            </button>
          </div>

          {showNewCustomer && (
            <form onSubmit={customerForm.handleSubmit(handleCreateCustomer)} className="space-y-3 bg-gray-50 rounded-lg p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Customer name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  {...customerForm.register('name')}
                />
                {customerForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-600">{customerForm.formState.errors.name.message}</p>
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
                  {...customerForm.register('phone')}
                />
                {customerForm.formState.errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{customerForm.formState.errors.phone.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={createCustomer.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {createCustomer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Customer
              </button>
            </form>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedCustomerId}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Discount Amount */}
      {step === 3 && (
        <div className="space-y-4">
          {selectedItem && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Vehicle</p>
              <p className="text-sm font-semibold text-gray-900">
                {selectedItem.variant?.model?.name} {selectedItem.variant?.name}
              </p>
              <p className="text-sm text-gray-600 mt-1">On-Road: {formatINR(selectedItem.on_road)}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">&#8377;</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                {...discountForm.register('discount_amount', { valueAsNumber: true })}
              />
            </div>
          </div>

          {discountAmount > 0 && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium">Approval Tier</p>
              <p className="text-sm font-semibold text-blue-800">
                {TIER_LABELS[getApprovalTier(discountAmount)]}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks (optional)</label>
            <textarea
              rows={3}
              placeholder="Any additional notes..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              {...discountForm.register('remarks')}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={createRequest.isPending || !discountAmount || discountAmount <= 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createRequest.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit for Approval
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
