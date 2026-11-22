export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { checkCredentials, createSession, sessionCookieOptions } from '../../../../lib/auth';
import { json } from '../../../../lib/api';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!checkCredentials(username, password)) {
    return json({ error: 'Invalid username or password. Use ADMIN_USERNAME and ADMIN_PASSWORD from Vercel env vars.' }, 401);
  }
  const token = createSession(username);
  const res = json({ ok: true });
  res.cookies.set('ztr_admin', token, sessionCookieOptions());
  return res;
}
