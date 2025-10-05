const API = '/api/products';

const tbody = document.querySelector('#productsTable tbody');
const qInput = document.getElementById('q');
const sortSel = document.getElementById('sort');
const orderSel = document.getElementById('order');
const limitSel = document.getElementById('limit');
const pageInfo = document.getElementById('pageInfo');

const refreshBtn = document.getElementById('refreshBtn');
const viewLowBtn = document.getElementById('viewLowBtn');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');

let state = {
  page: 1,
  limit: 10,
  q: '',
  sort: 'id',
  order: 'asc',
  totalPages: 1
};

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

async function loadPage() {
  // build query string
  const qs = new URLSearchParams({
    page: state.page,
    limit: state.limit,
    q: state.q,
    sort: state.sort,
    order: state.order
  });
  const data = await fetchJSON(`${API}?${qs.toString()}`);
  state.totalPages = data.totalPages || 1;
  // render rows
  tbody.innerHTML = (data.items || []).map(rowHTML).join('');
  pageInfo.textContent = `Page ${data.page} / ${data.totalPages} — ${data.total} total`;
  // controls
  prevPageBtn.disabled = state.page <= 1;
  nextPageBtn.disabled = state.page >= state.totalPages;
}

// events
applyFiltersBtn.onclick = () => {
  state.q = qInput.value.trim();
  state.sort = sortSel.value;
  state.order = orderSel.value;
  state.limit = parseInt(limitSel.value, 10);
  state.page = 1;
  loadPage().catch(err => alert(err.message));
};

refreshBtn.onclick = () => {
  qInput.value = '';
  sortSel.value = 'id';
  orderSel.value = 'asc';
  limitSel.value = '10';
  state = { page: 1, limit: 10, q: '', sort: 'id', order: 'asc', totalPages: 1 };
  loadPage().catch(err => alert(err.message));
};

viewLowBtn.onclick = async () => {
  const lows = await fetchJSON(`${API}/low/threshold`);
  tbody.innerHTML = lows.map(rowHTML).join('');
  pageInfo.textContent = `Low stock: ${lows.length} item(s)`;
  prevPageBtn.disabled = true;
  nextPageBtn.disabled = true;
};

prevPageBtn.onclick = () => {
  if (state.page > 1) {
    state.page--;
    loadPage().catch(err => alert(err.message));
  }
};

nextPageBtn.onclick = () => {
  if (state.page < state.totalPages) {
    state.page++;
    loadPage().catch(err => alert(err.message));
  }
};

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
      await loadPage();
    }
    if (action === 'del') {
      await fetchJSON(`${API}/${id}`, { method: 'DELETE' });
      await loadPage();
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
      await loadPage();
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
    state.page = 1; // show newest from first page
    await loadPage();
  } catch (err) {
    alert(err.message);
  }
});

loadPage().catch(err => alert(err.message));
