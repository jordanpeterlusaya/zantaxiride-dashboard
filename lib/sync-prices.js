import { sql } from './db';

function money(value) {
  const n = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function tourRatesForBooking(rates) {
  const group = {};
  let pp = null;
  for (const row of rates || []) {
    const amount = money(row.price);
    if (amount == null) continue;
    const label = String(row.label || '').trim();
    const people = parseInt(label, 10);
    if (people) group[people] = amount;
    else if (/per person/i.test(label)) pp = amount;
  }
  if (pp != null) return { pp };
  if (Object.keys(group).length) return { group };
  return null;
}

export function safariRatesForBooking(rates) {
  const out = {};
  for (const row of rates || []) {
    const amount = money(row.price);
    if (amount == null) continue;
    const label = String(row.label || '').toLowerCase();
    const isCash = /cash/.test(label);
    const isCard = /card|online|pay online/.test(label);
    const isSolo = /\b1\b/.test(label) || /solo/.test(label);
    if (isSolo && isCash) out.cashSolo = amount;
    else if (isSolo && (isCard || !isCash)) out.cardSolo = amount;
    else if (isCash) out.cash = amount;
    else if (isCard || /per person|from 2|pp/.test(label)) out.card = amount;
  }
  if (out.card == null && out.cash == null && out.cardSolo == null && out.cashSolo == null) {
    return null;
  }
  return out;
}

async function readPrices() {
  const rows = await sql`SELECT id, data FROM prices ORDER BY id DESC LIMIT 1`;
  if (!rows.length) return null;
  return { id: rows[0].id, data: rows[0].data || {} };
}

async function writePrices(id, data) {
  await sql`
    UPDATE prices
    SET data = ${JSON.stringify(data)}::jsonb, updated_at = now()
    WHERE id = ${id}
  `;
}

export async function syncTourIntoPrices(tour) {
  const current = await readPrices();
  if (!current) return;
  const key = tour.booking_item || tour.title;
  if (!key) return;
  const next = { ...current.data, tours: { ...(current.data.tours || {}) } };
  if (tour.active === false) {
    delete next.tours[key];
  } else {
    const mapped = tourRatesForBooking(tour.rates);
    if (mapped) next.tours[key] = mapped;
  }
  await writePrices(current.id, next);
}

export async function removeTourFromPrices(tour) {
  const current = await readPrices();
  if (!current) return;
  const key = tour?.booking_item || tour?.title;
  if (!key) return;
  const next = { ...current.data, tours: { ...(current.data.tours || {}) } };
  delete next.tours[key];
  await writePrices(current.id, next);
}

export async function syncSafariIntoPrices(safari) {
  const current = await readPrices();
  if (!current) return;
  const key = safari.booking_item || safari.title;
  if (!key) return;
  const next = { ...current.data, safari: { ...(current.data.safari || {}) } };
  if (safari.active === false) {
    delete next.safari[key];
  } else {
    const mapped = safariRatesForBooking(safari.rates);
    if (mapped) next.safari[key] = mapped;
  }
  await writePrices(current.id, next);
}

export async function removeSafariFromPrices(safari) {
  const current = await readPrices();
  if (!current) return;
  const key = safari?.booking_item || safari?.title;
  if (!key) return;
  const next = { ...current.data, safari: { ...(current.data.safari || {}) } };
  delete next.safari[key];
  await writePrices(current.id, next);
}

export async function rebuildPackagePrices() {
  const current = await readPrices();
  if (!current) return;
  const tours = await sql`SELECT title, booking_item, rates, active FROM tours ORDER BY sort_order ASC, id ASC`;
  const safaris = await sql`SELECT title, booking_item, rates, active FROM safaris ORDER BY sort_order ASC, id ASC`;
  const tourMap = { ...(current.data.tours || {}) };
  const safariMap = { ...(current.data.safari || {}) };

  for (const tour of tours) {
    const key = tour.booking_item || tour.title;
    if (!key) continue;
    if (tour.active === false) {
      delete tourMap[key];
      continue;
    }
    const mapped = tourRatesForBooking(tour.rates);
    if (mapped) tourMap[key] = mapped;
  }

  for (const safari of safaris) {
    const key = safari.booking_item || safari.title;
    if (!key) continue;
    if (safari.active === false) {
      delete safariMap[key];
      continue;
    }
    const mapped = safariRatesForBooking(safari.rates);
    if (mapped) safariMap[key] = mapped;
  }

  await writePrices(current.id, { ...current.data, tours: tourMap, safari: safariMap });
}
