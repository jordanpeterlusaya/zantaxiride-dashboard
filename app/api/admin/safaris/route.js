export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { sql } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/auth';
import { json, error } from '../../../../lib/api';

export async function GET() {
  try {
    await requireAdmin();
    const rows = await sql`SELECT * FROM safaris ORDER BY sort_order ASC, id ASC`;
    return json({ safaris: rows });
  } catch (err) {
    return error(err);
  }
}

export async function POST(req) {
  try {
    await requireAdmin();
    const s = await req.json();
    const slug = String(s.slug || '').trim();
    const title = String(s.title || '').trim();
    if (!slug || !title) return json({ error: 'slug and title required' }, 400);
    const notes = Array.isArray(s.notes) ? s.notes : [];
    const rates = Array.isArray(s.rates) ? s.rates : [];
    const rows = await sql`
      INSERT INTO safaris (slug, title, image, summary, includes, notes, rates, booking_item, active, sort_order)
      VALUES (
        ${slug}, ${title}, ${s.image || ''}, ${s.summary || ''}, ${s.includes || ''},
        ${JSON.stringify(notes)}::jsonb, ${JSON.stringify(rates)}::jsonb,
        ${s.booking_item || title}, ${s.active !== false}, ${Number(s.sort_order) || 0}
      )
      RETURNING *
    `;
    return json({ safari: rows[0] }, 201);
  } catch (err) {
    return error(err);
  }
}
