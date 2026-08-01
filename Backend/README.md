# AI Billing — Backend

Node.js/Express REST API for the AI-Powered Voice Billing Platform.

## Tech Stack

- Node.js >= 18 (ESM) · Express 4 · Mongoose 8 · MongoDB Atlas
- Gemini API (voice billing extraction + business assistant)
- Cloudinary (UPI QR images)
- JWT + refresh-token rotation, bcrypt, zod validation

## Setup

```bash
npm install
cp .env.example .env   # then fill in real values
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | no | Server port (default `8000`) |
| `MONGODB_URI` | yes | MongoDB connection string |
| `DB_NAME` | no | Database name (default `ai-billing`) |
| `JWT_SECRET` | yes | Access-token signing secret (min 16 chars) |
| `JWT_REFRESH_SECRET` | no | Refresh-token secret (falls back to `JWT_SECRET`) |
| `JWT_EXPIRY` / `JWT_REFRESH_EXPIRY` | no | Token lifetimes (default `7d` / `30d`) |
| `GEMINI_API_KEY` | yes | Google Gemini API key |
| `GEMINI_MODEL` | no | Model id (default `gemini-flash-latest`) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | yes | Cloudinary credentials for QR uploads |
| `RATE_LIMIT_MAX` | no | Requests per 15 min per IP (default `300`) |
| `LOGIN_MAX_FAILURES` | no | Failed logins before lockout, per email+IP (default `5`) |
| `LOGIN_WINDOW_MS` | no | Login lockout window in ms (default `900000`) |
| `GEMINI_MOCK` | no | Test-only: `ok` returns canned Gemini answers, `fail` simulates downtime |
| `CORS_ORIGIN` | no | Comma-separated allowed origins (default: all) |
| `NODE_ENV` | no | `production` hides error stacks, logs to files only |

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Run the server |
| `npm run dev` | Run with nodemon auto-reload |
| `npm test` | Lint + run the full test suite (57 tests) |
| `npm run test:watch` | Re-run tests on file changes |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier formatting |

Tests spawn an isolated server per suite (random port + throwaway database) and clean up after themselves — they never touch your real data.

## API Overview

Base URL: `/api/v1` — all routes except `auth/login`, `auth/register`, `/health`, `/metrics` require a Bearer token.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, sets refresh cookie |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Revoke refresh token |
| GET | `/auth/profile` | Current profile |
| PUT | `/auth/profile` | Update profile (multipart, optional `upiQrCode` image) |
| POST | `/billing/extract` | Voice text -> items via Gemini |
| POST | `/billing/save` | Save a bill |
| GET/POST | `/customers` | List / create customers (auto CUST numbers, `?search=`) |
| GET/POST | `/products` | List / create products |
| GET | `/bills` | List with `search`, `startDate`, `endDate`, `paymentMethod`, `paymentStatus`, `sortBy`, `sortOrder`, `page`, `limit` |
| GET | `/bills/:id` | Get single bill (customer populated as number) |
| GET | `/dashboard/summary` | Totals, today/week/month revenue, recent bills, top customers |
| GET | `/analytics/monthly` `/weekly` `/top-products` `/customer-report` | Analytics |
| POST | `/assistant/ask` | Business questions (EN/BN/HI) |
| GET | `/health` | DB/service pings, version, slow queries |
| GET | `/metrics` | Request count, errors, avg latency per route |

## Example: Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "ownerName": "Ramesh",
  "shopName": "Ramesh General Store",
  "shopType": "grocery",
  "email": "ramesh@example.com",
  "password": "secret123"
}
```

```json
{
  "statusCode": 201,
  "success": true,
  "message": "User registered successfully",
  "data": { "accessToken": "eyJhbGciOi...", "user": { "ownerName": "Ramesh", "email": "ramesh@example.com" } }
}
```

## Example: Save a Bill

```http
POST /api/v1/billing/save
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "items": [{ "productName": "Rice", "quantity": 2, "unit": "kg", "price": 200 }],
  "paymentMethod": "cash",
  "customerId": "665f1f77bcf86cd799439011"
}
```

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Bill saved",
  "data": { "bill": { "billNumber": "BILL-20260731-001", "totalAmount": 200, "paymentMethod": "cash", "paymentStatus": "paid" } }
}
```

## Error Format

All errors return `{ statusCode, success: false, message, errors? }`.

| Code | Meaning |
|---|---|
| 400 | Invalid input (zod validation, bad ObjectId) |
| 401 | Missing / invalid / expired token |
| 404 | Resource not found |
| 409 | Duplicate value (e.g. registered email) |
| 413 | Request payload too large (> 1 MB) |
| 429 | Rate limited — or login locked after too many failed attempts |
| 500 | Unexpected server error |
| 502 | Upstream AI failure (Gemini) |
| 503 | DB or network service temporarily unavailable |

## Structure

```
src/
├── index.js            boot: env validation, DB connect (retry), graceful shutdown
├── app.js              middleware chain, /health, /metrics, routes under /api/v1
├── config/             central config + env validation
├── db/                 mongoose connect + slow-query tracking
├── models/             User, Bill, Customer, Product (compound indexes)
├── middlewares/        auth, upload, error, requestId, metrics
├── controllers/        thin request handlers
├── routes/             per-resource routers
├── validators/         zod schemas
├── services/           analytics, billing, gemini, cloudinary (business logic)
├── helpers/            bill numbers (atomic counter), customer stats, stats
└── utils/              ApiError, ApiResponse, asyncHandler, logger (dated files)
```
