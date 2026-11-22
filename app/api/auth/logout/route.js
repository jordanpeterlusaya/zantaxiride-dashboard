export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { json } from '../../../../lib/api';

export async function POST() {
  const res = json({ ok: true });
  res.cookies.set('ztr_admin', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
