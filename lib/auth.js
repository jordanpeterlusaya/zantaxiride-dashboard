import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE = 'ztr_admin';
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  return process.env.AUTH_SECRET || 'dev-secret';
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = createHmac('sha256', secret()).update(body).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function createSession(username) {
  return sign({ u: username, exp: Date.now() + MAX_AGE * 1000 });
}

export async function setSessionCookie(token) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  cookies().set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  return verify(token);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  return session;
}

export function checkCredentials(username, password) {
  const u = (process.env.ADMIN_USERNAME || 'admin').trim();
  const p = (process.env.ADMIN_PASSWORD || 'admin').trim();
  return String(username || '').trim() === u && String(password || '').trim() === p;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  };
}
