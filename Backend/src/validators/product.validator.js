import { z } from 'zod';

const productFields = {
  name: z.string().min(1, 'Product name is required').optional(),
  price: z.number().nonnegative('Price cannot be negative').optional(),
  unit: z.string().trim().min(1).optional(),
  stock: z.number().nonnegative('Stock cannot be negative').optional(),
  category: z.string().trim().optional(),
  taxRate: z.number().min(0, 'Tax cannot be negative').max(100, 'Tax cannot exceed 100%').optional(),
  barcode: z
    .string()
    .trim()
    .max(48)
    .optional()
    .nullable(),
  aliases: z.array(z.string().trim().min(1)).max(20).optional(),
};

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().nonnegative('Price cannot be negative'),
  unit: z.string().optional(),
  stock: z.number().nonnegative('Stock cannot be negative').optional(),
  category: z.string().trim().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  barcode: z.string().trim().max(48).optional().nullable(),
  aliases: z.array(z.string().trim().min(1)).max(20).optional(),
});

export const updateProductSchema = z
  .object(productFields)
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });