export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { sql } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/auth';
import { json, error } from '../../../../lib/api';
import { syncTourIntoPrices } from '../../../../lib/sync-prices';

export async function GET() {
  try {
    await requireAdmin();
    const rows = await sql`SELECT * FROM tours ORDER BY sort_order ASC, id ASC`;
    return json({ tours: rows });
  } catch (err) {
    return error(err);
  }
}

export async function POST(req) {
  try {
    await requireAdmin();
    const t = await req.json();
    const slug = String(t.slug || '').trim();
    const title = String(t.title || '').trim();
    if (!slug || !title) return json({ error: 'slug and title required' }, 400);
    const notes = Array.isArray(t.notes) ? t.notes : [];
    const rates = Array.isArray(t.rates) ? t.rates : [];
    const rows = await sql`
      INSERT INTO tours (slug, title, eyebrow, image, summary, includes, excludes, notes, rates, booking_item, active, sort_order)
      VALUES (
        ${slug}, ${title}, ${t.eyebrow || ''}, ${t.image || ''}, ${t.summary || ''},
        ${t.includes || ''}, ${t.excludes || ''},
        ${JSON.stringify(notes)}::jsonb, ${JSON.stringify(rates)}::jsonb,
        ${t.booking_item || title}, ${t.active !== false}, ${Number(t.sort_order) || 0}
      )
      RETURNING *
    `;
    await syncTourIntoPrices(rows[0]);
    return json({ tour: rows[0] }, 201);
  } catch (err) {
    return error(err);
  }
}
