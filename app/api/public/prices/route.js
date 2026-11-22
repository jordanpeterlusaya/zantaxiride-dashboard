import { sql } from '../../../../lib/db';
import { withCors } from '../../../../lib/cors';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  const rows = await sql`SELECT data, updated_at FROM prices ORDER BY id DESC LIMIT 1`;
  if (!rows.length) {
    return withCors(NextResponse.json({ error: 'No prices' }, { status: 404 }));
  }
  return withCors(NextResponse.json({ prices: rows[0].data, updatedAt: rows[0].updated_at }));
}
