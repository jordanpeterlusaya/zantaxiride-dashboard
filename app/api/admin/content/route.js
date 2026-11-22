import { sql } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/auth';
import { json, error } from '../../../../lib/api';

export async function GET() {
  try {
    await requireAdmin();
    const blocks = await sql`SELECT * FROM content_blocks ORDER BY id ASC`;
    const settings = await sql`SELECT * FROM site_settings ORDER BY id DESC LIMIT 1`;
    return json({ blocks, settings: settings[0] || null });
  } catch (err) {
    return error(err);
  }
}

export async function PUT(req) {
  try {
    await requireAdmin();
    const body = await req.json();
    if (Array.isArray(body.blocks)) {
      for (const b of body.blocks) {
        if (b.id) {
          await sql`UPDATE content_blocks SET label = ${b.label || ''}, body = ${b.body || ''}, updated_at = now() WHERE id = ${b.id}`;
        } else if (b.key) {
          await sql`
            INSERT INTO content_blocks (key, label, body)
            VALUES (${b.key}, ${b.label || b.key}, ${b.body || ''})
            ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, body = EXCLUDED.body, updated_at = now()
          `;
        }
      }
    }
    if (body.settings && typeof body.settings === 'object') {
      const existing = await sql`SELECT id FROM site_settings ORDER BY id DESC LIMIT 1`;
      if (existing.length) {
        await sql`UPDATE site_settings SET data = ${JSON.stringify(body.settings)}::jsonb, updated_at = now() WHERE id = ${existing[0].id}`;
      } else {
        await sql`INSERT INTO site_settings (data) VALUES (${JSON.stringify(body.settings)}::jsonb)`;
      }
    }
    return json({ ok: true });
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
    await sql`DELETE FROM content_blocks WHERE id = ${id}`;
    return json({ ok: true });
  } catch (err) {
    return error(err);
  }
}
