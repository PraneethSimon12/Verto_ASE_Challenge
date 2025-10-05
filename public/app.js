const API = '/api/products';
const API_KEY = 'dev-secret-key'; // change if you set process.env.API_KEY in server

const tbody = document.querySelector('#productsTable tbody');
const refreshBtn = document.getElementById('refreshBtn');
const viewLowBtn = document.getElementById('viewLowBtn');

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1500);
}

async function fetchJSON(url, opts) {
  const isWrite = opts && ['POST','PUT','DELETE','PATCH'].includes((opts.method || 'GET').toUpperCase());
  const headers = { 'Content-Type': 'application/json', ...(opts && opts.headers) };
  if (isWrite) headers['x-api-key'] = API_KEY;

  const res = await fetch(url, { headers, ...opts });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  // export CSV returns text; others return json
  const ctype = res.headers.get('content-type') || '';
  if (ctype.includes('application/json')) return res.json();
  return res.text();
}

function rowHTML(p) {
  const low = p.stock_quantity < p.low_stock_threshold;
  const badge = low ? '<span class="badge low">Low</span>' : '';
  return `
    <tr class="${low ? 'low' : ''}">
      <td>${p.id}</td>
      <td>
        <div class="name">${p.name} ${badge}</div>
        <div class="desc">${p.description || ''}</div>
      </td>
      <td>${p.stock_quantity}</td>
      <td>${p.low_stock_threshold}</td>
      <td>
        <div class="actions">
          <input type="number" min="1" value="1" id="amt-${p.id}" />
          <button data-act="inc" data-id="${p.id}">+ Add</button>
          <button data-act="dec" data-id="${p.id}">- Remove</button>
          <button data-act="edit" data-id="${p.id}">Edit</button>
          <button data-act="del" data-id="${p.id}">Delete</button>
        </div>
      </td>
    </tr>`;
}

async function loadAll() {
  const items = await fetchJSON(API);
  tbody.innerHTML = items.map(rowHTML).join('');
  await updateStats(items);
}

async function loadLow() {
  const items = await fetchJSON(`${API}/low/threshold`);
  tbody.innerHTML = items.map(rowHTML).join('');
  document.getElementById('statsLine')?.textContent = `Low stock: ${items.length} item(s)`;
}

async function updateStats(maybeItems) {
  let items = maybeItems;
  if (!Array.isArray(items)) {
    items = await fetchJSON(API);
  }
  const totalProducts = items.length;
  const totalQty = items.reduce((s, p) => s + (p.stock_quantity || 0), 0);
  const lowCount = items.filter(p => p.stock_quantity < p.low_stock_threshold).length;
  const el = document.getElementById('statsLine');
  if (el) el.textContent = `Products: ${totalProducts} • Total Qty: ${totalQty} • Low stock: ${lowCount}`;
}

refreshBtn.onclick = loadAll;
viewLowBtn.onclick = loadLow;

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.act;
  try {
    if (action === 'inc' || action === 'dec') {
      const amt = parseInt(document.getElementById(`amt-${id}`).value || '1', 10);
      await fetchJSON(`${API}/${id}/${action === 'inc' ? 'increase' : 'decrease'}-stock`, {
        method: 'POST',
        body: JSON.stringify({ amount: amt })
      });
      await loadAll();
      toast('Updated');
    }
    if (action === 'del') {
      await fetchJSON(`${API}/${id}`, { method: 'DELETE' });
      await loadAll();
      toast('Deleted');
    }
    if (action === 'edit') {
      const name = prompt('New name? (leave blank to keep)');
      const description = prompt('New description? (leave blank to keep)');
      const qty = prompt('New stock quantity? (leave blank to keep)');
      const thr = prompt('New low_stock_threshold? (leave blank to keep)');
      const body = {};
      if (name) body.name = name;
      if (description) body.description = description;
      if (qty) body.stock_quantity = Number(qty);
      if (thr) body.low_stock_threshold = Number(thr);
      await fetchJSON(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      await loadAll();
      toast('Updated');
    }
  } catch (err) {
    alert(err.message);
  }
});

// create form
const form = document.getElementById('createForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const payload = Object.fromEntries(fd.entries());
  payload.stock_quantity = Number(payload.stock_quantity || 0);
  payload.low_stock_threshold = Number(payload.low_stock_threshold || 0);
  try {
    await fetchJSON(API, { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    await loadAll();
    toast('Created');
  } catch (err) {
    alert(err.message);
  }
});

loadAll().catch(err => alert(err.message));
