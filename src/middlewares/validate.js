import { z } from 'zod';

export const productCreateSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  stock_quantity: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional()
});

export const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  stock_quantity: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional()
});

export const stockAmountSchema = z.object({
  amount: z.number().int().min(1, 'amount must be > 0')
});

export function validate(schema) {
  return (req, _res, next) => {
    try {
      // convert numeric strings to numbers
      const body = Object.fromEntries(
        Object.entries(req.body || {}).map(([k, v]) => [
          k,
          typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))
            ? Number(v)
            : v
        ])
      );
      req.body = schema.parse(body);
      next();
    } catch (e) {
      e.status = 400;
      next(e);
    }
  };
}
