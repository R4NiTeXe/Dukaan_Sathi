import { z } from 'zod'

export const registerSchema = z.object({
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  shopName: z.string().min(2, 'Shop name must be at least 2 characters'),
  shopType: z.enum([
    'grocery',
    'stationery',
    'pharmacy',
    'electronics',
    'clothing',
    'other',
  ]),
  shopAddress: z.string().optional(),
  preferredLanguage: z.enum(['bn', 'hi', 'en']).default('en'),
  upiQrCode: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const updateProfileSchema = z.object({
  ownerName: z.string().min(2).optional(),
  shopName: z.string().min(2).optional(),
  shopType: z
    .enum([
      'grocery',
      'stationery',
      'pharmacy',
      'electronics',
      'clothing',
      'other',
    ])
    .optional(),
  shopAddress: z.string().optional(),
  preferredLanguage: z.enum(['bn', 'hi', 'en']).optional(),
  upiQrCode: z.string().optional(),
})
export const refreshSchema = z.object({})
