export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { checkCredentials, createSession, setSessionCookie } from '../../../../lib/auth';
import { json } from '../../../../lib/api';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body;
  if (!checkCredentials(String(username || ''), String(password || ''))) {
    return json({ error: 'Invalid username or password' }, 401);
  }
  const token = createSession(username);
  await setSessionCookie(token);
  return json({ ok: true });
}
