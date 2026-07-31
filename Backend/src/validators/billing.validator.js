import { z } from 'zod'

export const billItemSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  price: z.number().nonnegative('Price cannot be negative'),
})

export const extractResponseSchema = z
  .array(billItemSchema)
  .min(1, 'At least one item is required')

export const saveBillSchema = z.object({
  items: z.array(billItemSchema).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['cash', 'upi']),
  paymentStatus: z.enum(['paid', 'pending']).optional(),
  customerId: z.string().nullable().optional(),
})

export const updateBillSchema = z
  .object({
    items: z.array(billItemSchema).min(1).optional(),
    paymentMethod: z.enum(['cash', 'upi']).optional(),
    paymentStatus: z.enum(['paid', 'pending']).optional(),
    customerId: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
