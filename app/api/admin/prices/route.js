import { sql } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/auth';
import { json, error } from '../../../../lib/api';

export async function GET() {
  try {
    await requireAdmin();
    const rows = await sql`SELECT id, data, updated_at FROM prices ORDER BY id DESC LIMIT 1`;
    return json({ prices: rows[0]?.data || null, updatedAt: rows[0]?.updated_at || null });
  } catch (err) {
    return error(err);
  }
}

export async function PUT(req) {
  try {
    await requireAdmin();
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ error: 'Invalid prices payload' }, 400);
    }
    const existing = await sql`SELECT id FROM prices ORDER BY id DESC LIMIT 1`;
    if (existing.length) {
      await sql`UPDATE prices SET data = ${JSON.stringify(body)}::jsonb, updated_at = now() WHERE id = ${existing[0].id}`;
    } else {
      await sql`INSERT INTO prices (data) VALUES (${JSON.stringify(body)}::jsonb)`;
    }
    return json({ ok: true });
  } catch (err) {
    return error(err);
  }
}
