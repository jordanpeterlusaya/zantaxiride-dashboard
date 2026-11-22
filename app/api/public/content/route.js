import { sql } from '../../../../lib/db';
import { withCors } from '../../../../lib/cors';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  const blocks = await sql`SELECT key, label, body FROM content_blocks ORDER BY id ASC`;
  const settings = await sql`SELECT data FROM site_settings ORDER BY id DESC LIMIT 1`;
  return withCors(NextResponse.json({
    blocks,
    settings: settings[0]?.data || {},
  }));
}
