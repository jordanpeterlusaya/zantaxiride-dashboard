export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { sql } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/auth';
import { json, error } from '../../../../lib/api';

export async function GET() {
  try {
    await requireAdmin();
    const rows = await sql`SELECT * FROM media ORDER BY id DESC`;
    return json({ media: rows });
  } catch (err) {
    return error(err);
  }
}

export async function POST(req) {
  try {
    await requireAdmin();
    const m = await req.json();
    const url = String(m.url || '').trim();
    if (!url) return json({ error: 'url required' }, 400);
    const rows = await sql`
      INSERT INTO media (url, alt, kind)
      VALUES (${url}, ${m.alt || ''}, ${m.kind || 'image'})
      RETURNING *
    `;
    return json({ item: rows[0] }, 201);
  } catch (err) {
    return error(err);
  }
}

export async function DELETE(req) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) return json({ error: 'id required' }, 400);
    await sql`DELETE FROM media WHERE id = ${id}`;
    return json({ ok: true });
  } catch (err) {
    return error(err);
  }
}
