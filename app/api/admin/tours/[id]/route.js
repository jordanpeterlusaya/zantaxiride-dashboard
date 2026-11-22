export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { sql } from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/auth';
import { json, error } from '../../../../../lib/api';
import { removeTourFromPrices, syncTourIntoPrices } from '../../../../../lib/sync-prices';

export async function GET(_req, { params }) {
  try {
    await requireAdmin();
    const id = Number(params.id);
    const rows = await sql`SELECT * FROM tours WHERE id = ${id}`;
    if (!rows.length) return json({ error: 'Not found' }, 404);
    return json({ tour: rows[0] });
  } catch (err) {
    return error(err);
  }
}

export async function PUT(req, { params }) {
  try {
    await requireAdmin();
    const id = Number(params.id);
    const t = await req.json();
    const notes = Array.isArray(t.notes) ? t.notes : [];
    const rates = Array.isArray(t.rates) ? t.rates : [];
    const rows = await sql`
      UPDATE tours SET
        slug = ${String(t.slug || '').trim()},
        title = ${String(t.title || '').trim()},
        eyebrow = ${t.eyebrow || ''},
        image = ${t.image || ''},
        summary = ${t.summary || ''},
        includes = ${t.includes || ''},
        excludes = ${t.excludes || ''},
        notes = ${JSON.stringify(notes)}::jsonb,
        rates = ${JSON.stringify(rates)}::jsonb,
        booking_item = ${t.booking_item || t.title || ''},
        active = ${t.active !== false},
        sort_order = ${Number(t.sort_order) || 0},
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    if (!rows.length) return json({ error: 'Not found' }, 404);
    await syncTourIntoPrices(rows[0]);
    return json({ tour: rows[0] });
  } catch (err) {
    return error(err);
  }
}

export async function DELETE(_req, { params }) {
  try {
    await requireAdmin();
    const id = Number(params.id);
    const existing = await sql`SELECT title, booking_item FROM tours WHERE id = ${id}`;
    await sql`DELETE FROM tours WHERE id = ${id}`;
    if (existing[0]) await removeTourFromPrices(existing[0]);
    return json({ ok: true });
  } catch (err) {
    return error(err);
  }
}
