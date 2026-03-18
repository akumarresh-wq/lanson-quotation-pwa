import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useVehicleModels, usePriceListItems, useActivePriceList } from '../../hooks/usePriceList'
import { useCustomers, useCreateCustomer } from '../../hooks/useCustomers'
import { useCreateQuotation } from '../../hooks/useQuotations'
import { useAuth } from '../../context/AuthContext'
import { customerSchema, type CustomerInput } from '../../lib/validators'
import { formatINR } from '../../lib/formatters'
import PriceRow from '../common/PriceRow'
import type { DiscountRequest, PriceListItem } from '../../types/database'

export default function QuotationForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()
  const discountRequest = (location.state as { discountRequest?: DiscountRequest } | null)?.discountRequest

  const { data: models } = useVehicleModels()
  const { data: priceList } = useActivePriceList()
  const { data: allItems } = usePriceListItems(priceList?.id)
  const { data: customers } = useCustomers()
  const createCustomer = useCreateCustomer()
  const createQuotation = useCreateQuotation()

  const [selectedModelId, setSelectedModelId] = useState('')
  const [selectedItem, setSelectedItem] = useState<PriceListItem | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [discount, setDiscount] = useState(0)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const customerForm = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', email: '' },
  })

  // Pre-fill from discount request
  useEffect(() => {
    if (discountRequest && allItems) {
      const item = allItems.find((i) => i.variant_id === discountRequest.variant_id)
      if (item) {
        setSelectedModelId(item.variant?.model?.id ?? '')
        setSelectedItem(item)
      }
      setSelectedCustomerId(discountRequest.customer_id)
      setDiscount(discountRequest.approved_amount ?? discountRequest.discount_amount)
    }
  }, [discountRequest, allItems])

  const modelItems = allItems?.filter((item) => item.variant?.model?.id === selectedModelId) ?? []

  const onRoad = selectedItem ? selectedItem.on_road - discount : 0

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

    try {
      const result = await createQuotation.mutateAsync({
        variant_id: selectedItem.variant_id,
        customer_id: selectedCustomerId,
        created_by: profile.id,
        discount_request_id: discountRequest?.id ?? null,
        ex_showroom: selectedItem.ex_showroom,
        gst: selectedItem.gst,
        tcs: selectedItem.tcs,
        insurance: selectedItem.insurance,
        rto: selectedItem.rto,
        fastag: selectedItem.fastag,
        accessories: selectedItem.accessories,
        discount,
        on_road: selectedItem.on_road - discount,
      })
      navigate(`/quotations/${result.id}`, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create quotation')
    }
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Quotation</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 mb-4">{error}</div>
      )}

      <div className="space-y-4">
        {/* Vehicle Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Model</label>
          <select
            value={selectedModelId}
            onChange={(e) => {
              setSelectedModelId(e.target.value)
              setSelectedItem(null)
            }}
            disabled={!!discountRequest}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
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
              disabled={!!discountRequest}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
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

        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer</label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            disabled={!!discountRequest}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
          >
            <option value="">Select a customer</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
            ))}
          </select>
        </div>

        {!discountRequest && (
          <div className="text-center">
            <button
              onClick={() => setShowNewCustomer(!showNewCustomer)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
            >
              <UserPlus className="h-4 w-4" />
              {showNewCustomer ? 'Cancel' : 'Add New Customer'}
            </button>
          </div>
        )}

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

        {/* Discount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">&#8377;</span>
            <input
              type="number"
              inputMode="numeric"
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              disabled={!!discountRequest}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Price Breakdown */}
        {selectedItem && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Price Breakdown</h3>
            <PriceRow label="Ex-Showroom" amount={selectedItem.ex_showroom} />
            {selectedItem.gst > 0 && <PriceRow label="GST" amount={selectedItem.gst} />}
            {selectedItem.tcs > 0 && <PriceRow label="TCS" amount={selectedItem.tcs} />}
            {selectedItem.insurance > 0 && <PriceRow label="Insurance" amount={selectedItem.insurance} />}
            {selectedItem.rto > 0 && <PriceRow label="RTO" amount={selectedItem.rto} />}
            {selectedItem.fastag > 0 && <PriceRow label="FASTag" amount={selectedItem.fastag} />}
            {selectedItem.accessories > 0 && <PriceRow label="Accessories" amount={selectedItem.accessories} />}
            {discount > 0 && (
              <div className="flex items-center justify-between py-1.5 text-green-600">
                <span className="text-sm">Discount</span>
                <span className="text-sm">-{formatINR(discount)}</span>
              </div>
            )}
            <div className="mt-1 pt-1 border-t border-gray-200">
              <PriceRow label="On-Road Price" amount={onRoad} highlight />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedItem || !selectedCustomerId || createQuotation.isPending}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createQuotation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Quotation
        </button>
      </div>
    </div>
  )
}
