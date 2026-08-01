# API Reference — AI Billing Backend

Base URL: `http://localhost:8000/api/v1` (production: your Render URL + `/api/v1`)

Authentication: `Authorization: Bearer <accessToken>` on all routes except `auth/register`, `auth/login`, `/health`, `/metrics`.

Every response body follows `{ statusCode, success, message, data }`; every error follows `{ statusCode, success: false, message, errors? }`.

---

## Auth

### POST /auth/register
Body: `{ ownerName, shopName, shopType, email, password }`
- `shopType`: `grocery` | `electronics` | `clothing` | `other`
- `password`: min 6 chars

**201** → `{ accessToken, refreshToken, user }` · **400** invalid · **409** duplicate email

### POST /auth/login
Body: `{ email, password }`

**200** → `{ accessToken, refreshToken, user }` + `Set-Cookie: refreshToken` (httpOnly, 30d, Path=/) · **401** bad credentials

**429** — too many failed attempts for this email+IP (default 5 in 15 min, configurable via `LOGIN_MAX_FAILURES` / `LOGIN_WINDOW_MS`). A successful login resets the counter.

### POST /auth/refresh
No body. Sends new `Set-Cookie`. Rotates the refresh token (old one becomes invalid).

**200** → `{ accessToken }` · **401** missing/revoked/expired cookie

### POST /auth/logout
No body. Revokes the current refresh token.

**200**

### PUT /auth/profile
Multipart form-data (or JSON). Fields: `ownerName`, `shopName`, `shopType`, `upiId`, optional file `upiQrCode` (image, ≤ 5 MB).
Replacing the QR deletes the old Cloudinary image.

**200** → `{ user }` (without password) · **400** no fields provided

---

## Voice Billing

### POST /billing/extract
Body: `{ transcript }` (Bengali/Hindi/English voice text)

**200** → `{ items: [{ productName, quantity, unit, price }] }` · **400** empty/ invalid transcript · **502** Gemini failure

### POST /billing/save
Body:
```json
{
  "items": [{ "productName": "Rice", "quantity": 2, "unit": "kg", "price": 200 }],
  "paymentMethod": "cash",
  "paymentStatus": "paid",
  "customerId": "665f1f77bcf86cd799439011"
}
```
`customerId` optional. Bill numbers are atomic per day: `BILL-YYYYMMDD-NNN`.

**201** → `{ bill }` · **400** invalid data

---

## Customers

| Method | Path | Notes |
|---|---|---|
| GET | `/customers` | Query: `page`, `limit` (≤50), `search` (customer number) → `{ customers, pagination }` |
| POST | `/customers` | Body: `{}` — number auto-assigned as `CUST-<userId>-NNN` |

Customer `totalPurchases` is recalculated whenever a linked bill is saved.

---

## Products

| Method | Path | Notes |
|---|---|---|
| GET | `/products` | Query: `page`, `limit`, `search` (name) → `{ products, pagination }` |
| POST | `/products` | Body: `{ name, price, unit?, stock? }` |

---

## Bills

### GET /bills
Query params: `page` (≥1), `limit` (1–50), `search` (bill number / product name), `startDate`, `endDate` (ISO dates), `paymentMethod` (`cash`|`upi`), `paymentStatus` (`paid`|`pending`), `sortBy` (`createdAt`|`totalAmount`), `sortOrder` (`asc`|`desc`).

**200** → `{ bills, pagination: { page, limit, total, totalPages } }`

### GET /bills/:id
**200** → `{ bill }` with `customerId` populated as `customerNumber`

---

## Dashboard & Analytics

### GET /dashboard/summary
**200** → `{ totalBills, totalRevenue, todayRevenue, monthlyRevenue, billsThisWeek, recentBills[5], topCustomers[5] }`

### GET /analytics/monthly
**200** → `{ data: [{ month: 'YYYY-MM', totalRevenue, billCount }] }` (last 6 months)

### GET /analytics/weekly
**200** → `{ data: [{ date: 'YYYY-MM-DD', totalRevenue, billCount }] }` (last 7 days)

### GET /analytics/top-products?limit=10
**200** → `{ data: [{ productName, totalRevenue, totalQuantity, timesSold }] }` sorted by revenue

### GET /analytics/customer-report
**200** → `{ data: [{ customerId, customerNumber, billCount, totalSpent }] }`

---

## Assistant

### POST /assistant/ask
Body: `{ question }`. Intent detection covers: today's summary, top products, weekly comparison, customer insights, monthly trend, general summary — in English, Hindi, or Bengali. Data is fetched from your own bills; Gemini only writes the answer.

**200** → `{ answer, intent, data }` · **400** empty question · **502** Gemini unavailable

---

## Ops

### GET /health
**200** → `{ status, timestamp, version, nodeVersion, uptime, database, services: { gemini, cloudinary }, memory, slowQueries[] }`
**503** when DB disconnected (status `degraded`).

### GET /metrics
**200** → `{ requests, errors, errorRate, avgResponseMs, routes: { "METHOD path": { count, errors, totalTimeMs, avgMs, maxMs } } }`
