export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { sql } from '../../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET(_req, { params }) {
  const id = Number(params.id);
  if (!id) return new NextResponse('Not found', { status: 404 });
  const rows = await sql`SELECT mime, data FROM image_files WHERE id = ${id}`;
  if (!rows.length) return new NextResponse('Not found', { status: 404 });
  const mime = String(rows[0].mime || 'image/jpeg');
  if (!mime.startsWith('image/')) return new NextResponse('Not found', { status: 404 });
  const body = Buffer.from(rows[0].data, 'base64');
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
