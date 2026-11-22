export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { sql } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/auth';
import { json, error } from '../../../../lib/api';

const MAX_BYTES = 3_000_000;

export async function POST(req) {
  try {
    await requireAdmin();
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') return json({ error: 'Choose a photo' }, 400);
    const mime = file.type || 'image/jpeg';
    if (!mime.startsWith('image/')) return json({ error: 'Only photos can be uploaded' }, 400);
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!bytes.length) return json({ error: 'That photo is empty' }, 400);
    if (bytes.length > MAX_BYTES) return json({ error: 'Photo is too large. Try another one.' }, 400);

    const rows = await sql`
      INSERT INTO image_files (mime, data)
      VALUES (${mime}, ${bytes.toString('base64')})
      RETURNING id
    `;
    const id = rows[0].id;
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const url = `${proto}://${host}/api/public/files/${id}`;
    const alt = String(form.get('alt') || '');
    await sql`
      INSERT INTO media (url, alt, kind)
      VALUES (${url}, ${alt}, 'image')
    `;
    return json({ url, id }, 201);
  } catch (err) {
    return error(err);
  }
}
