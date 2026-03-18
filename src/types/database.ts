export type UserRole = 'sales_officer' | 'team_leader' | 'branch_manager' | 'sales_vp' | 'coo' | 'jmd' | 'md' | 'admin'
export type ApprovalTier = 'sales_vp' | 'coo' | 'director'
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'escalated'
export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric'
export type TransmissionType = 'mt' | 'at' | 'cvt' | 'ivt' | 'e_drive'

export interface Branch { id: string; name: string; code: string; zone: string; is_active: boolean; created_at: string }
export interface Profile { id: string; phone: string; full_name: string; role: UserRole; branch_id: string | null; lm_number: string | null; push_subscription: unknown; is_active: boolean; created_at: string; updated_at: string; branch?: Branch }
export interface VehicleModel { id: string; name: string; display_order: number; is_active: boolean; created_at: string }
export interface VehicleVariant { id: string; model_id: string; name: string; fuel: FuelType; transmission: TransmissionType; is_active: boolean; created_at: string; model?: VehicleModel }
export interface PriceList { id: string; title: string; effective_from: string; effective_to: string | null; uploaded_by: string | null; is_active: boolean; created_at: string }
export interface PriceListItem { id: string; price_list_id: string; variant_id: string; ex_showroom: number; gst: number; tcs: number; insurance: number; rto: number; fastag: number; accessories: number; on_road: number; created_at: string; variant?: VehicleVariant & { model?: VehicleModel } }
export interface Customer { id: string; name: string; phone: string; email: string | null; created_by: string; branch_id: string | null; created_at: string }
export interface DiscountRequest { id: string; request_number: string; variant_id: string; customer_id: string; requested_by: string; discount_amount: number; on_road_price: number; remarks: string | null; status: RequestStatus; approval_tier: ApprovalTier; assigned_to: string | null; approved_amount: number | null; approved_by: string | null; approved_at: string | null; created_at: string; updated_at: string; variant?: VehicleVariant & { model?: VehicleModel }; customer?: Customer; requestor?: Profile; approver?: Profile }
export interface ApprovalLogEntry { id: string; request_id: string; action: 'approved' | 'rejected' | 'escalated'; actor_id: string; remarks: string | null; approved_amount: number | null; created_at: string; actor?: Profile }
export interface Quotation { id: string; quotation_number: string; discount_request_id: string | null; variant_id: string; customer_id: string; created_by: string; ex_showroom: number; gst: number; tcs: number; insurance: number; rto: number; fastag: number; accessories: number; discount: number; on_road: number; shared_via_whatsapp: boolean; created_at: string; variant?: VehicleVariant & { model?: VehicleModel }; customer?: Customer }
export interface Notification { id: string; user_id: string; title: string; body: string; type: string; reference_id: string | null; is_read: boolean; push_sent: boolean; whatsapp_sent: boolean; created_at: string }
