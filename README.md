<div align="center">

# Dukaan Saathi

### AI-Powered Billing & Business Intelligence Platform for Local Indian Shops

**Speak in Bengali, Hindi, or English — let AI do the billing.**

Voice-driven bill generation · Real-time analytics · AI business advisor · Multi-language support

</div>

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=nodedotjs&logoColor=white&style=flat-square)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white&style=flat-square)](https://expressjs.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white&style=flat-square)](https://nextjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white&style=flat-square)](https://mongodb.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=googlegemini&logoColor=white&style=flat-square)](https://aistudio.google.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?logo=cloudinary&logoColor=white&style=flat-square)](https://cloudinary.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

<p align="center">
  <a href="https://dukaansathi-ai.vercel.app/">Live Demo</a> ·
  <a href="#project-overview">Overview</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#environment-variables">Environment Variables</a>
</p>

---

## Project Overview

**Dukaan Saathi** (दुकान साथी · দোকান সাথী — *"Shop Companion"*) is a full-stack AI-powered billing and business intelligence platform built for **local Indian small businesses** — grocery stores, pharmacies, electronics shops, clothing stores, and more.

It replaces manual paper billing with an **AI voice-to-bill pipeline** powered by **Google Gemini**, allowing shop owners to speak a customer's purchase in **Bengali, Hindi, or English** and receive a structured bill in seconds.

Beyond billing, Dukaan Saathi delivers a **real-time analytics dashboard**, **customer management**, **product inventory tracking**, and an **AI business advisor** that answers natural-language questions about the shop's performance using real database numbers.

---

## Features

| Feature | Description |
|---|---|
| Voice-to-Bill AI | Speak purchases in Bengali, Hindi, or English — Gemini extracts every item, quantity, unit, and price automatically |
| Recent Billed Items | One-tap re-billing: recent products with last price, unit, and billing time, plus quantity steppers |
| Smart Billing | Catalog matching with saved prices, ambiguous-product resolution, and automatic learning of new products |
| Real-Time Dashboard | Area charts for revenue trends, top-product charts, and live summary cards |
| AI Business Advisor | Intent-detection engine with targeted MongoDB aggregations, narrated by Gemini |
| Customer Management | Purchase history, total spend, and bill count per phone number |
| Product Inventory | Catalogue with name, price, unit, stock, category, and tax rates |
| Profile & Payments | Profile avatars with live preview and shop UPI QR codes on bills |
| Authentication | Dual-token JWT with silent refresh, brute-force protection, and httpOnly cookies |
| Theming | Dark / light mode with system preference support |

---

## Tech Stack

### Backend

| Category | Technology |
|---|---|
| Runtime | Node.js >= 18 (ESM) |
| Framework | Express 4 |
| Database | MongoDB Atlas + Mongoose 8 |
| AI | Google Gemini Flash |
| Auth | JSON Web Tokens + bcrypt |
| Validation | Zod |
| Media | Cloudinary + Multer |
| Security | Helmet, CORS, express-rate-limit |

### Frontend

| Category | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 18 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Animations | Framer Motion |
| HTTP | Axios |
| Icons | Lucide |
| Theme | next-themes |

---

## Installation

### Prerequisites

```bash
node --version   # >= 18.0.0
npm --version    # >= 9.0.0
```

You will also need a **MongoDB Atlas** cluster, a **Google Gemini API key**, and a **Cloudinary** account.

### 1. Clone the repository

```bash
git clone https://github.com/R4NiTeXe/Dukaan_Sathi.git
cd Dukaan_Sathi
```

### 2. Run the backend

```bash
cd Backend
npm install
cp .env.example .env      # then fill in your credentials
npm run dev               # → http://localhost:8000
```

### 3. Run the frontend

```bash
cd ../
cd Frontend
npm install
cp .env.example .env.local
npm run dev               # → http://localhost:3000
```

### 4. Verify

```bash
curl http://localhost:8000/health
```

```json
{
  "status": "ok",
  "database": "connected",
  "services": { "gemini": "ok", "cloudinary": "ok" }
}
```

> The Next.js dev proxy forwards `/api/v1/*` to the backend, so no CORS setup is needed locally.

---

## Environment Variables

### Backend (`Backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `8000` | Server port |
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `DB_NAME` | No | `ai-billing` | Database name |
| `JWT_SECRET` | Yes | — | Access token secret (min 16 chars) |
| `JWT_REFRESH_SECRET` | No | `JWT_SECRET` | Refresh token secret |
| `JWT_EXPIRY` | No | `7d` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | No | `30d` | Refresh token lifetime |
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-flash-latest` | Gemini model |
| `CLOUDINARY_CLOUD_NAME` | Yes | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | — | Cloudinary API secret |
| `RATE_LIMIT_MAX` | No | `300` | Requests per 15 minutes per IP |
| `CORS_ORIGIN` | No | `*` | Allowed origins (comma-separated) |

### Frontend (`Frontend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `/api/v1` | API base URL (uses Next.js proxy) |
| `BACKEND_API_URL` | Yes (prod) | `http://localhost:8000` | Backend origin for proxy rewrites |

---

## Project Structure

```
Dukaan_Sathi/
├── Backend/                     # Express.js REST API (ESM)
│   ├── src/
│   │   ├── app.js               # Express app, middleware registration
│   │   ├── index.js             # Server entry point
│   │   ├── config/              # Env config + Cloudinary setup
│   │   ├── controllers/         # Route handlers (auth, billing, products, …)
│   │   ├── models/              # Mongoose models (User, Bill, Product, Customer)
│   │   ├── routes/              # /api/v1/* route definitions
│   │   ├── middlewares/         # JWT, upload, rate limit, request tracing
│   │   ├── services/            # Gemini, analytics, billing, cloudinary
│   │   ├── validators/          # Zod schemas
│   │   ├── helpers/             # Bill numbers, customer stats
│   │   └── utils/               # ApiError/ApiResponse, asyncHandler, logger
│   ├── tests/                    # Node test runner + supertest
│   └── render.yaml               # Render.com deployment config
│
├── Frontend/                     # Next.js 15 App Router
│   ├── src/
│   │   ├── app/                  # Pages (dashboard, billing, bills, products, …)
│   │   ├── components/           # layout/, billing/, modals/, ui/
│   │   ├── context/              # AuthContext (auth state + route guards)
│   │   ├── services/             # Axios instance + silent-refresh interceptor
│   │   ├── constants/            # Navigation, languages, categories
│   │   └── utils/                # Animations, time formatting
│   ├── tests/                    # Vitest + React Testing Library
│   └── next.config.mjs           # API proxy rewrites to backend
│
└── README.md
```

---

## Author

<div align="center">
  <br>
  <b>R4NiTeXe</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Pritam Maji</b>
  <br><br>
  <a href="https://github.com/R4NiTeXe"><img src="https://img.shields.io/badge/GitHub-R4NiTeXe-181717?style=for-the-badge&logo=github" alt="R4NiTeXe"></a> &nbsp;&nbsp;&nbsp; <a href="https://github.com/pritamroman07-droid"><img src="https://img.shields.io/badge/GitHub-pritamroman07--droid-181717?style=for-the-badge&logo=github" alt="Pritam Maji"></a>
  <br><br>
</div>

---

## License

This project is licensed under the [MIT License](LICENSE) — free to use, modify, and distribute.

---

<div align="center">

**If Dukaan Sathi helps your project, give it a star!**

*Built with care for Indian small businesses*

</div>