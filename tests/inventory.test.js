import { increaseStock, decreaseStock } from '../src/services/inventory.js';


describe('Inventory service', () => {
const base = { id: 1, name: 'Pen', description: '', stock_quantity: 10, low_stock_threshold: 3 };


test('increase adds amount', () => {
const out = increaseStock(base, 5);
expect(out.stock_quantity).toBe(15);
});


test('increase rejects non-positive', () => {
expect(() => increaseStock(base, 0)).toThrow();
expect(() => increaseStock(base, -2)).toThrow();
});


test('decrease subtracts within limit', () => {
const out = decreaseStock(base, 7);
expect(out.stock_quantity).toBe(3);
});


test('decrease rejects insufficient stock', () => {
expect(() => decreaseStock(base, 11)).toThrow(/insufficient/i);
});
});