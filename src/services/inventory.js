export function increaseStock(product, amount) {
const amt = Number(amount);
if (!Number.isFinite(amt) || amt <= 0) throw Object.assign(new Error('amount must be > 0'), { status: 400 });
const updated = { ...product, stock_quantity: product.stock_quantity + Math.trunc(amt) };
return updated;
}


export function decreaseStock(product, amount) {
const amt = Number(amount);
if (!Number.isFinite(amt) || amt <= 0) throw Object.assign(new Error('amount must be > 0'), { status: 400 });
const nextQty = product.stock_quantity - Math.trunc(amt);
if (nextQty < 0) throw Object.assign(new Error('insufficient stock'), { status: 400 });
const updated = { ...product, stock_quantity: nextQty };
return updated;
}