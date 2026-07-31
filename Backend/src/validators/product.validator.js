import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().optional(),
  price: z.number().nonnegative('Price cannot be negative'),
  unit: z.string().optional(),
  stock: z.number().nonnegative('Stock cannot be negative').optional(),
});

export const updateProductSchema = z
  .object({
    name: z.string().min(1).optional(),
    category: z.string().optional(),
    price: z.number().nonnegative().optional(),
    unit: z.string().optional(),
    stock: z.number().nonnegative().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });
