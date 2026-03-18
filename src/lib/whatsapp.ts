import type { PriceListItem, Quotation, DiscountRequest, Profile } from '../types/database'
import { formatINR } from './formatters'

// Generate wa.me deep link
function waLink(phone: string, text: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const withCountry = cleaned.startsWith('91') ? cleaned : `91${cleaned}`
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`
}

// Price list share message for a model (groups all variants)
export function priceListMessage(
  modelName: string,
  items: PriceListItem[],
  officer: Profile
): string {
  let msg = `*${modelName} - Price List*\n`
  msg += `_Lanson Toyota_\n\n`
  for (const item of items) {
    const variantName = item.variant?.name ?? ''
    msg += `*${variantName}*\n`
    msg += `Ex-Showroom: ${formatINR(item.ex_showroom)}\n`
    msg += `On-Road: ${formatINR(item.on_road)}\n\n`
  }
  msg += `---\n`
  msg += `${officer.full_name}\n`
  msg += `Lanson Toyota${officer.branch ? ' - ' + officer.branch.name : ''}\n`
  if (officer.phone) msg += `Ph: ${officer.phone}`
  return msg
}

// Generate WhatsApp share link for price list
export function sharePriceList(
  phone: string,
  modelName: string,
  items: PriceListItem[],
  officer: Profile
): string {
  return waLink(phone, priceListMessage(modelName, items, officer))
}

// Quotation share message
export function quotationMessage(q: Quotation, officer: Profile): string {
  const model = q.variant?.model?.name ?? ''
  const variant = q.variant?.name ?? ''
  let msg = `*Quotation ${q.quotation_number}*\n`
  msg += `*${model} ${variant}*\n`
  msg += `Customer: ${q.customer?.name ?? ''}\n\n`
  msg += `Ex-Showroom: ${formatINR(q.ex_showroom)}\n`
  if (q.gst) msg += `GST: ${formatINR(q.gst)}\n`
  if (q.tcs) msg += `TCS: ${formatINR(q.tcs)}\n`
  if (q.insurance) msg += `Insurance: ${formatINR(q.insurance)}\n`
  if (q.rto) msg += `RTO: ${formatINR(q.rto)}\n`
  if (q.fastag) msg += `FASTag: ${formatINR(q.fastag)}\n`
  if (q.accessories) msg += `Accessories: ${formatINR(q.accessories)}\n`
  if (q.discount) msg += `Discount: -${formatINR(q.discount)}\n`
  msg += `\n*On-Road Price: ${formatINR(q.on_road)}*\n\n`
  msg += `---\n`
  msg += `${officer.full_name}\n`
  msg += `Lanson Toyota${officer.branch ? ' - ' + officer.branch.name : ''}\n`
  if (officer.phone) msg += `Ph: ${officer.phone}`
  return msg
}

// Share quotation via WhatsApp
export function shareQuotation(phone: string, q: Quotation, officer: Profile): string {
  return waLink(phone, quotationMessage(q, officer))
}

// Discount request notification message for approver
export function discountNotifyMessage(req: DiscountRequest): string {
  const model = req.variant?.model?.name ?? ''
  const variant = req.variant?.name ?? ''
  let msg = `*Discount Approval Request*\n`
  msg += `Request: ${req.request_number}\n`
  msg += `Vehicle: ${model} ${variant}\n`
  msg += `Customer: ${req.customer?.name ?? ''}\n`
  msg += `Discount: ${formatINR(req.discount_amount)}\n`
  msg += `On-Road: ${formatINR(req.on_road_price)}\n`
  msg += `Requested by: ${req.requestor?.full_name ?? ''}\n`
  return msg
}
