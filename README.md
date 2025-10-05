## ASE Challenge — Inventory Management System (Node + Mini UI) 🚀

A review-friendly Inventory Management API with a tiny frontend.
Stack: Node.js (Express), Vanilla JS UI, JSON file store, Jest tests, Swagger, API-key auth, Rate limiting, Movement audit.






✨ Why this is worth reviewing

Realistic core: Product CRUD + safe stock ops (never goes negative).

Practical extras: Low-stock endpoint, stock movement audit, API-key for write ops, rate limiting, Swagger docs, and a mini UI to demo end-to-end.

Zero setup: File-based DB; runs with 3 commands. Docker image included.

🧭 Quickstart (3 commands)
npm install
npm run dev
# UI:   http://localhost:3000
# API:  http://localhost:3000/api/docs  (Swagger)


Default API key for write operations: dev-secret-key
(Used automatically by the UI. In Swagger/Postman, add header: x-api-key: dev-secret-key.)

🎯 Features

Products

Create / Read / Update / Delete

Fields: name, description, stock_quantity, low_stock_threshold

Inventory rules

Increase / Decrease stock endpoints

No negative stock → returns 400 when insufficient

Low stock

GET /api/products/low/threshold shows items below their threshold

Validation & Errors

Zod validation on request bodies

Predictable JSON errors: { "error": "...", "details": [...]? }

Audit trail

Every stock change logged with { type, amount, before, after, at }

GET /api/products/movements and GET /api/products/:id/movements

Mini UI

Add / edit / delete products

Increase / decrease stock

Overview (products • total qty • low-stock count)

Low badges + success toasts

Operational polish

Swagger docs at /api/docs

Rate limit on /api/*

Health: /api/health

Version: /api/version

CORS configurable via env

Not included (kept scope focused): CSV import/export; API pagination/search.



GET routes are open.

POST / PUT / DELETE and stock ops require header:
x-api-key: <your-key>

Default (dev): dev-secret-key

Override by setting env var API_KEY=your-strong-key.

Swagger tip: add the header in each “Try it out” request.

⚙️ Run locally (detailed)
# 1) Install dependencies
npm install

# 2) Start in dev mode (hot reload)
npm run dev

# 3) Open
# UI:    http://localhost:3000
# Docs:  http://localhost:3000/api/docs
# Health http://localhost:3000/api/health


Environment variables (optional):

PORT (default 3000)

API_KEY (default dev-secret-key)

CORS_ORIGINS (default http://localhost:3000, comma-separated list)

🧪 Tests
npm test


Covers inventory rules:

Increase adds positive amounts

Rejects non-positive amounts

Decrease within available stock

Rejects insufficient stock (no negatives)

🧑‍💻 API quick reference
Method	Path	Auth	Description
GET	/api/health	–	Service health
GET	/api/version	–	Name & version
GET	/api/products	–	List products
POST	/api/products	✅	Create product
GET	/api/products/:id	–	Get one
PUT	/api/products/:id	✅	Update product
DELETE	/api/products/:id	✅	Delete product
POST	/api/products/:id/increase-stock	✅	Increase stock
POST	/api/products/:id/decrease-stock	✅	Decrease stock (400 if insufficient)
GET	/api/products/low/threshold	–	Products below threshold
GET	/api/products/movements	–	All stock movements
GET	/api/products/:id/movements	–	Movements for one product

Auth = x-api-key: dev-secret-key (or your API_KEY)

📜 Example requests

Create:

curl -X POST http://localhost:3000/api/products \
  -H "content-type: application/json" \
  -H "x-api-key: dev-secret-key" \
  -d '{"name":"Pen","description":"Blue","stock_quantity":10,"low_stock_threshold":3}'


Increase / Decrease:

curl -X POST http://localhost:3000/api/products/1/increase-stock \
  -H "content-type: application/json" -H "x-api-key: dev-secret-key" \
  -d '{"amount":5}'

curl -X POST http://localhost:3000/api/products/1/decrease-stock \
  -H "content-type: application/json" -H "x-api-key: dev-secret-key" \
  -d '{"amount":2}'


Low stock:

curl http://localhost:3000/api/products/low/threshold


Movements:

curl http://localhost:3000/api/products/movements

🖥️ Mini UI — what to click

Open http://localhost:3000

Add Product → row appears

+ Add / – Remove with an amount → quantity updates

Try removing more than available → alert: insufficient stock

View Low Stock → shows only risky items

Edit (prompt-based) and Delete work as expected

Overview shows Products • Total Qty • Low-stock count; risky items have a Low badge; success actions show small toasts.
