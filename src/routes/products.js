import { Router } from 'express';
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  saveProduct,
  addMovement,
  listMovements
} from '../lib/db.js';
import { increaseStock, decreaseStock } from '../services/inventory.js';
import {
  validate,
  productCreateSchema,
  productUpdateSchema,
  stockAmountSchema
} from '../middlewares/validate.js';
import { requireApiKey } from '../middlewares/auth.js';

const router = Router();

/* ---------- Collections ---------- */

// List all
router.get('/', async (_req, res, next) => {
  try {
    const products = await listProducts();
    res.json(products);
  } catch (e) { next(e); }
});

// Low stock list (place BEFORE '/:id')
router.get('/low/threshold', async (_req, res, next) => {
  try {
    const all = await listProducts();
    const lows = all.filter(p => p.stock_quantity < p.low_stock_threshold);
    res.json(lows);
  } catch (e) { next(e); }
});

// All movements (global audit)
router.get('/movements', async (_req, res, next) => {
  try {
    const rows = await listMovements();
    res.json(rows);
  } catch (e) { next(e); }
});

// CSV export (all products)
router.get('/export/csv', async (_req, res, next) => {
  try {
    const items = await listProducts();
    const header = 'id,name,description,stock_quantity,low_stock_threshold\n';
    const body = items.map(p =>
      [
        p.id,
        JSON.stringify(p.name ?? ''),          // handle commas/quotes
        JSON.stringify(p.description ?? ''),
        p.stock_quantity ?? 0,
        p.low_stock_threshold ?? 0
      ].join(',')
    ).join('\n');
    const csv = header + body + '\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  } catch (e) { next(e); }
});

// CSV import (text/plain body)
router.post('/import/csv', requireApiKey, async (req, res, next) => {
  try {
    if (!req.headers['content-type']?.includes('text/plain')) {
      const err = new Error('Send CSV as text/plain body'); err.status = 400; throw err;
    }
    const text = String(req.body || '').trim();
    if (!text) { const err = new Error('CSV body is empty'); err.status = 400; throw err; }

    const lines = text.split(/\r?\n/).filter(Boolean);
    const header = lines.shift()?.toLowerCase().split(',').map(s => s.trim()) || [];
    const required = ['name','description','stock_quantity','low_stock_threshold'];
    const ok = required.every(k => header.includes(k));
    if (!ok) {
      const err = new Error('CSV header must be: ' + required.join(',')); err.status = 400; throw err;
    }
    const idx = Object.fromEntries(header.map((h, i) => [h, i]));

    const created = [];
    for (const line of lines) {
      const cols = line.split(',');
      const payload = {
        name: (cols[idx.name] || '').replace(/^"|"$/g,''),
        description: (cols[idx.description] || '').replace(/^"|"$/g,''),
        stock_quantity: Number(cols[idx.stock_quantity] || 0),
        low_stock_threshold: Number(cols[idx.low_stock_threshold] || 0)
      };
      const p = await createProduct(payload);
      created.push(p);
    }
    res.status(201).json({ created: created.length, items: created });
  } catch (e) { next(e); }
});

// Create (validated + API key)
router.post('/', requireApiKey, validate(productCreateSchema), async (req, res, next) => {
  try {
    const product = await createProduct(req.body || {});
    res.status(201).json(product);
  } catch (e) { next(e); }
});

/* ---------- Single resource ---------- */

// Movements for a single product
router.get('/:id/movements', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const all = await listMovements();
    res.json(all.filter(m => m.product_id === id));
  } catch (e) { next(e); }
});

// Read one
router.get('/:id', async (req, res, next) => {
  try {
    const prod = await getProductById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    res.json(prod);
  } catch (e) { next(e); }
});

// Update (validated + API key)
router.put('/:id', requireApiKey, validate(productUpdateSchema), async (req, res, next) => {
  try {
    const updated = await updateProduct(req.params.id, req.body || {});
    res.json(updated);
  } catch (e) { next(e); }
});

// Delete (API key)
router.delete('/:id', requireApiKey, async (req, res, next) => {
  try {
    const removed = await deleteProduct(req.params.id);
    res.json(removed);
  } catch (e) { next(e); }
});

/* ---------- Stock operations (validated + logged + API key) ---------- */

router.post('/:id/increase-stock', requireApiKey, validate(stockAmountSchema), async (req, res, next) => {
  try {
    const prod = await getProductById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });

    const before = prod.stock_quantity;
    const updated = increaseStock(prod, req.body.amount);

    await saveProduct(updated);
    await addMovement({
      product_id: updated.id,
      type: 'increase',
      amount: req.body.amount,
      before,
      after: updated.stock_quantity
    });

    res.json(updated);
  } catch (e) { next(e); }
});

router.post('/:id/decrease-stock', requireApiKey, validate(stockAmountSchema), async (req, res, next) => {
  try {
    const prod = await getProductById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });

    const before = prod.stock_quantity;
    const updated = decreaseStock(prod, req.body.amount);

    await saveProduct(updated);
    await addMovement({
      product_id: updated.id,
      type: 'decrease',
      amount: req.body.amount,
      before,
      after: updated.stock_quantity
    });

    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
