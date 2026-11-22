import https from 'https';
import dns from 'dns';
import { neon, neonConfig } from '@neondatabase/serverless';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {}

neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const DATABASE_URL = process.env.DATABASE_URL;
const host = new URL(DATABASE_URL.replace(/^postgresql:/, 'https:')).hostname;

function neonHttp(queryText, params) {
  const body = JSON.stringify({ query: queryText, params });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: host,
        path: '/sql',
        method: 'POST',
        family: 4,
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          'Neon-Connection-String': DATABASE_URL,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(data || `Neon HTTP ${res.statusCode}`));
          }
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.rows || []);
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Neon request timeout')));
    req.write(body);
    req.end();
  });
}

function toQuery(strings, values) {
  let text = '';
  const params = [];
  strings.forEach((str, i) => {
    text += str;
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  });
  return { text, params };
}

/** Tagged template compatible with neon()`...` usage in this app. */
export async function sql(strings, ...values) {
  // Prefer official neon driver when fetch works (Vercel / most clouds)
  if (process.env.NEON_USE_FETCH === '1') {
    const driver = neon(DATABASE_URL);
    return driver(strings, ...values);
  }
  const { text, params } = toQuery(strings, values);
  return neonHttp(text, params);
}
