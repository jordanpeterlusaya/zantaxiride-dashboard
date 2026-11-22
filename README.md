# ZantaxiRide Admin Dashboard

Phone-first CMS for [ZantaxiRide](https://www.zantaxiride.com) — edit taxi prices, tour/safari packages, site text and media.

## Stack

- Next.js 14 (App Router)
- Neon Postgres (`@neondatabase/serverless`)
- Cookie session auth

## Setup

```bash
cp .env.example .env.local
# fill DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD, AUTH_SECRET
npm install
npm run seed
npm run dev
```

Open `http://localhost:3010` on a phone or narrow browser window.

## Public APIs (for the website)

- `GET /api/public/prices`
- `GET /api/public/tours`
- `GET /api/public/safaris`
- `GET /api/public/content`

## Admin login

Uses `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env.local`.
