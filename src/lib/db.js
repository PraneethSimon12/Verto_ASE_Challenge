import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'db.json');


async function readDB() {
const raw = await fs.readFile(DB_PATH, 'utf-8');
return JSON.parse(raw);
}


async function writeDB(db) {
await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}


export async function listProducts() {
const db = await readDB();
return db.products;
}


export async function getProductById(id) {
const db = await readDB();
return db.products.find(p => p.id === Number(id));
}


export async function createProduct({ name, description = '', stock_quantity = 0, low_stock_threshold = 0 }) {
if (!name || typeof name !== 'string') throw Object.assign(new Error('name is required'), { status: 400 });
if (stock_quantity < 0) throw Object.assign(new Error('stock_quantity cannot be negative'), { status: 400 });
if (low_stock_threshold < 0) throw Object.assign(new Error('low_stock_threshold cannot be negative'), { status: 400 });


const db = await readDB();
const product = {
id: db.nextId++,
name: name.trim(),
description: String(description || ''),
stock_quantity: Math.trunc(stock_quantity),
low_stock_threshold: Math.trunc(low_stock_threshold)
};
db.products.push(product);
await writeDB(db);
return product;
}


export async function updateProduct(id, patch) {
const db = await readDB();
const idx = db.products.findIndex(p => p.id === Number(id));
if (idx === -1) throw Object.assign(new Error('Product not found'), { status: 404 });


const current = db.products[idx];
const next = { ...current };


if (patch.name !== undefined) {
if (!patch.name || typeof patch.name !== 'string') throw Object.assign(new Error('name must be non-empty string'), { status: 400 });
next.name = patch.name.trim();
}
if (patch.description !== undefined) next.description = String(patch.description);
if (patch.stock_quantity !== undefined) {
const q = Math.trunc(patch.stock_quantity);
if (q < 0) throw Object.assign(new Error('stock_quantity cannot be negative'), { status: 400 });
next.stock_quantity = q;
}
if (patch.low_stock_threshold !== undefined) {
const t = Math.trunc(patch.low_stock_threshold);
if (t < 0) throw Object.assign(new Error('low_stock_threshold cannot be negative'), { status: 400 });
next.low_stock_threshold = t;
}


db.products[idx] = next;
await writeDB(db);
return next;
}


export async function deleteProduct(id) {
const db = await readDB();
const idx = db.products.findIndex(p => p.id === Number(id));
if (idx === -1) throw Object.assign(new Error('Product not found'), { status: 404 });
const [removed] = db.products.splice(idx, 1);
await writeDB(db);
return removed;
}


export async function saveProduct(updated) {
const db = await readDB();
const idx = db.products.findIndex(p => p.id === Number(updated.id));
if (idx === -1) throw Object.assign(new Error('Product not found'), { status: 404 });
db.products[idx] = updated;
await writeDB(db);
return updated;
}