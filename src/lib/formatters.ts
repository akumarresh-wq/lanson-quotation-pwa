// Format number as Indian currency (₹1,23,456)
export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

// Format phone number for display
export function formatPhone(phone: string): string {
  if (phone.length === 10) return `${phone.slice(0, 5)} ${phone.slice(5)}`
  return phone
}

// Format date for display
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

// Format date with time
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// Fuel type display labels
export function fuelLabel(fuel: string): string {
  const labels: Record<string, string> = { petrol: 'Petrol', diesel: 'Diesel', hybrid: 'Hybrid', electric: 'EV', e_drive: 'EV' }
  return labels[fuel] ?? fuel
}

// Transmission display labels
export function transmissionLabel(tx: string): string {
  const labels: Record<string, string> = { mt: 'MT', at: 'AT', cvt: 'CVT', ivt: 'IVT', e_drive: 'E-Drive' }
  return labels[tx] ?? tx
}
