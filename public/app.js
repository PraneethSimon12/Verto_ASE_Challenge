const API = '/api/products';


const tbody = document.querySelector('#productsTable tbody');
const refreshBtn = document.getElementById('refreshBtn');
const viewLowBtn = document.getElementById('viewLowBtn');


async function fetchJSON(url, opts) {
const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
if (!res.ok) throw new Error((await res.json()).error || res.statusText);
return res.json();
}


function rowHTML(p) {
const low = p.stock_quantity < p.low_stock_threshold;
return `
<tr class="${low ? 'low' : ''}">
<td>${p.id}</td>
<td>
<div class="name">${p.name}</div>
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
}


async function loadLow() {
const items = await fetchJSON(`${API}/low/threshold`);
tbody.innerHTML = items.map(rowHTML).join('');
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
}
if (action === 'del') {
await fetchJSON(`${API}/${id}`, { method: 'DELETE' });
await loadAll();
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
} catch (err) {
alert(err.message);
}
});


loadAll();