import { Router } from 'express';
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  saveProduct
} from '../lib/db.js';
import { increaseStock, decreaseStock } from '../services/inventory.js';
import {
  validate,
  productCreateSchema,
  productUpdateSchema,
  stockAmountSchema
} from '../middlewares/validate.js';

const router = Router();

/* ---------- Collections ---------- */

// List all
router.get('/', async (_req, res, next) => {
  try {
    const products = await listProducts();
    res.json(products);
  } catch (e) { next(e); }
});

// Create (VALIDATED)
router.post('/', validate(productCreateSchema), async (req, res, next) => {
  try {
    const product = await createProduct(req.body || {});
    res.status(201).json(product);
  } catch (e) { next(e); }
});

// Low stock list (place BEFORE '/:id' routes)
router.get('/low/threshold', async (_req, res, next) => {
  try {
    const all = await listProducts();
    const lows = all.filter(p => p.stock_quantity < p.low_stock_threshold);
    res.json(lows);
  } catch (e) { next(e); }
});

/* ---------- Single resource ---------- */

// Read one
router.get('/:id', async (req, res, next) => {
  try {
    const prod = await getProductById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    res.json(prod);
  } catch (e) { next(e); }
});

// Update (VALIDATED)
router.put('/:id', validate(productUpdateSchema), async (req, res, next) => {
  try {
    const updated = await updateProduct(req.params.id, req.body || {});
    res.json(updated);
  } catch (e) { next(e); }
});

// Delete
router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await deleteProduct(req.params.id);
    res.json(removed);
  } catch (e) { next(e); }
});

/* ---------- Stock operations (VALIDATED) ---------- */

router.post('/:id/increase-stock', validate(stockAmountSchema), async (req, res, next) => {
  try {
    const prod = await getProductById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    const updated = increaseStock(prod, req.body.amount);
    await saveProduct(updated);
    res.json(updated);
  } catch (e) { next(e); }
});

router.post('/:id/decrease-stock', validate(stockAmountSchema), async (req, res, next) => {
  try {
    const prod = await getProductById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    const updated = decreaseStock(prod, req.body.amount);
    await saveProduct(updated);
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
