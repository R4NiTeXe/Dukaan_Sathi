import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().nonnegative('Price cannot be negative'),
  unit: z.string().optional(),
  stock: z.number().nonnegative('Stock cannot be negative').optional(),
});
