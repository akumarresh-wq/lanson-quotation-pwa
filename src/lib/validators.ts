import { z } from 'zod'

export const loginSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
})

export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email().optional().or(z.literal('')),
})

export const discountRequestSchema = z.object({
  variant_id: z.string().uuid('Select a vehicle variant'),
  customer_id: z.string().uuid('Select a customer'),
  discount_amount: z.number().int().positive('Discount must be positive'),
  on_road_price: z.number().int().positive(),
  remarks: z.string().optional(),
})

export const approvalSchema = z.object({
  action: z.enum(['approved', 'rejected']),
  remarks: z.string().optional(),
  approved_amount: z.number().int().positive().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type OtpInput = z.infer<typeof otpSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type DiscountRequestInput = z.infer<typeof discountRequestSchema>
export type ApprovalInput = z.infer<typeof approvalSchema>
