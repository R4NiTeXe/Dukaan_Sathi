import { z } from 'zod'

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const updateCustomerSchema = z
  .object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
