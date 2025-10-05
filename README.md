# ASE Challenge — Inventory Management System (Node + Mini UI) 🚀

> A review-friendly Inventory Management API with a tiny frontend.  
> **Stack:** Node.js (Express), Vanilla JS UI, JSON file store, Jest tests, Swagger, API-key auth, Rate limiting, Movement audit.

---

## ✨ Features

- **Products**
  - Create / Read / Update / Delete
  - Fields: `name`, `description`, `stock_quantity`, `low_stock_threshold`
- **Inventory rules**
  - **Increase / Decrease stock** endpoints
  - **No negative stock** → returns **400** when insufficient
- **Low stock**
  - `GET /api/products/low/threshold` shows items below their threshold
- **Validation & Errors**
  - Zod validation on request bodies
  - Predictable JSON errors: `{ "error": "...", "details": [...]? }`
- **Audit trail**
  - Every stock change logged with `{ type, amount, before, after, at }`
  - `GET /api/products/movements` and `GET /api/products/:id/movements`
- **Mini UI**
  - Add / edit / delete products
  - Increase / decrease stock
  - **Overview** (products • total qty • low-stock count)
  - **Low** badges + success **toasts**
- **Operational polish**
  - **Swagger** docs at `/api/docs`
  - **Rate limit** on `/api/*`
  - **Health:** `/api/health`
  - **Version:** `/api/version`
  - **CORS** configurable via env

> **Scope note:** CSV import/export and API pagination/search are not included in this submission (kept focused).

---

## 🔐 Authentication (simple & clear)

- **GET** routes are open.
- **POST / PUT / DELETE** and stock ops require header:

# Run locally

 1) Install dependencies
npm install

 2) Start in dev mode (hot reload)
npm run dev

 3) Open in browser
 UI    → http://localhost:3000
 Docs  → http://localhost:3000/api/docs
 Health→ http://localhost:3000/api/health

 # Tests

 npm test

# API Reference

| Method | Path                               | Auth | Description                          |
| -----: | ---------------------------------- | :--: | ------------------------------------ |
|    GET | `/api/health`                      |   –  | Service health                       |
|    GET | `/api/version`                     |   –  | Name & version                       |
|    GET | `/api/products`                    |   –  | List products                        |
|   POST | `/api/products`                    |   ✅  | Create product                       |
|    GET | `/api/products/:id`                |   –  | Get one                              |
|    PUT | `/api/products/:id`                |   ✅  | Update product                       |
| DELETE | `/api/products/:id`                |   ✅  | Delete product                       |
|   POST | `/api/products/:id/increase-stock` |   ✅  | Increase stock                       |
|   POST | `/api/products/:id/decrease-stock` |   ✅  | Decrease stock (400 if insufficient) |
|    GET | `/api/products/low/threshold`      |   –  | Products below threshold             |
|    GET | `/api/products/movements`          |   –  | All stock movements                  |
|    GET | `/api/products/:id/movements`      |   –  | Movements for one product            |




