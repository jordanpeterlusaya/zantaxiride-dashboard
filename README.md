# ZantaxiRide Admin Dashboard

Phone-first Next.js CMS for [ZantaxiRide](https://www.zantaxiride.com) — edit taxi prices, tour/safari packages, site text and media. Data lives on Neon Postgres.

## Vercel (manual deploy)

1. Import this repo in Vercel (Framework Preset: **Next.js**).
2. Add Environment Variables (Production + Preview):
   - `DATABASE_URL` — Neon connection string
   - `ADMIN_USERNAME` — e.g. `admin`
   - `ADMIN_PASSWORD` — strong password
   - `AUTH_SECRET` — long random string
   - `NEXT_PUBLIC_SITE_ORIGIN` — `https://www.zantaxiride.com`
3. Deploy.
4. Optional: seed once locally with `npm run seed` (uses `.env.local`).

## Local

```bash
cp .env.example .env.local
# fill values
npm install
npm run seed
npm run dev
```

Open `http://localhost:3010` on a phone or narrow window.

## Public APIs

- `GET /api/public/prices`
- `GET /api/public/tours`
- `GET /api/public/safaris`
- `GET /api/public/content`
