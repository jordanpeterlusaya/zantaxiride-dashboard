import { sql } from '../../../../lib/db';
import { withCors } from '../../../../lib/cors';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  const rows = await sql`
    SELECT id, slug, title, eyebrow, image, summary, includes, excludes, notes, rates, booking_item, sort_order
    FROM tours WHERE active = true ORDER BY sort_order ASC, id ASC
  `;
  return withCors(NextResponse.json({ tours: rows }));
}
