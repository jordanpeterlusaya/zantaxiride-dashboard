export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { sql } from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/auth';
import { json, error } from '../../../../../lib/api';

export async function GET(_req, { params }) {
  try {
    await requireAdmin();
    const id = Number(params.id);
    const rows = await sql`SELECT * FROM safaris WHERE id = ${id}`;
    if (!rows.length) return json({ error: 'Not found' }, 404);
    return json({ safari: rows[0] });
  } catch (err) {
    return error(err);
  }
}

export async function PUT(req, { params }) {
  try {
    await requireAdmin();
    const id = Number(params.id);
    const s = await req.json();
    const notes = Array.isArray(s.notes) ? s.notes : [];
    const rates = Array.isArray(s.rates) ? s.rates : [];
    const rows = await sql`
      UPDATE safaris SET
        slug = ${String(s.slug || '').trim()},
        title = ${String(s.title || '').trim()},
        image = ${s.image || ''},
        summary = ${s.summary || ''},
        includes = ${s.includes || ''},
        notes = ${JSON.stringify(notes)}::jsonb,
        rates = ${JSON.stringify(rates)}::jsonb,
        booking_item = ${s.booking_item || s.title || ''},
        active = ${s.active !== false},
        sort_order = ${Number(s.sort_order) || 0},
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    if (!rows.length) return json({ error: 'Not found' }, 404);
    return json({ safari: rows[0] });
  } catch (err) {
    return error(err);
  }
}

export async function DELETE(_req, { params }) {
  try {
    await requireAdmin();
    const id = Number(params.id);
    await sql`DELETE FROM safaris WHERE id = ${id}`;
    return json({ ok: true });
  } catch (err) {
    return error(err);
  }
}
