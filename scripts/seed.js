const dns = require('dns');
try { dns.setDefaultResultOrder('ipv4first'); } catch (_) {}
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

function runSql(query) {
  const conn = process.env.DATABASE_URL;
  const u = new URL(conn.replace(/^postgresql:/, 'https:'));
  const endpoint = `https://${u.hostname}/sql`;
  const body = JSON.stringify({ query, params: [] });
  return new Promise((resolve, reject) => {
    const req = https.request(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Neon-Connection-String': conn,
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 60000,
        family: 4,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode >= 400) return reject(new Error(data || `HTTP ${res.statusCode}`));
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.write(body);
    req.end();
  });
}

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, name), 'utf8'));
}

function esc(s) {
  return String(s).replace(/'/g, "''");
}

async function main() {
  const prices = readJson('prices-seed.json');
  const tours = readJson('tours-seed.json');
  const safaris = readJson('safaris-seed.json');

  await runSql('DELETE FROM prices');
  await runSql(`INSERT INTO prices (data) VALUES ('${esc(JSON.stringify(prices))}'::jsonb)`);

  await runSql('DELETE FROM tours');
  for (const t of tours) {
    const notes = JSON.stringify(t.notes || []);
    const rates = JSON.stringify(t.rates || []);
    await runSql(`INSERT INTO tours (slug, title, eyebrow, image, summary, includes, excludes, notes, rates, booking_item, active, sort_order) VALUES (
      '${esc(t.slug)}', '${esc(t.title)}', '${esc(t.eyebrow || '')}', '${esc(t.image || '')}',
      '${esc(t.summary || '')}', '${esc(t.includes || '')}', '${esc(t.excludes || '')}',
      '${esc(notes)}'::jsonb, '${esc(rates)}'::jsonb, '${esc(t.booking_item || t.title)}',
      ${t.active !== false}, ${t.sort_order ?? 0}
    )`);
  }

  await runSql('DELETE FROM safaris');
  for (const s of safaris) {
    const notes = JSON.stringify(s.notes || []);
    const rates = JSON.stringify(s.rates || []);
    await runSql(`INSERT INTO safaris (slug, title, image, summary, includes, notes, rates, booking_item, active, sort_order) VALUES (
      '${esc(s.slug)}', '${esc(s.title)}', '${esc(s.image || '')}', '${esc(s.summary || s.eyebrow || '')}',
      '${esc(s.includes || '')}', '${esc(notes)}'::jsonb, '${esc(rates)}'::jsonb,
      '${esc(s.booking_item || s.title)}', ${s.active !== false}, ${s.sort_order ?? 0}
    )`);
  }

  await runSql('DELETE FROM content_blocks');
  const blocks = [
    { key: 'home_tagline', label: 'Home tagline', body: 'Airport transfers, private tours & safari from Zanzibar.' },
    { key: 'whatsapp_note', label: 'WhatsApp booking note', body: 'Send your pickup time and hotel name on WhatsApp after booking.' },
    { key: 'footer_blurb', label: 'Footer blurb', body: 'ZantaxiRide — reliable taxi, tours and safari in Zanzibar.' },
  ];
  for (const b of blocks) {
    await runSql(`INSERT INTO content_blocks (key, label, body) VALUES ('${esc(b.key)}', '${esc(b.label)}', '${esc(b.body)}')`);
  }

  await runSql('DELETE FROM site_settings');
  await runSql(`INSERT INTO site_settings (data) VALUES ('${esc(JSON.stringify({ brand: 'ZantaxiRide', whatsapp: '+255777000000', currency: 'USD' }))}'::jsonb)`);

  const counts = await runSql(`SELECT
    (SELECT count(*)::int FROM tours) AS tours,
    (SELECT count(*)::int FROM safaris) AS safaris,
    (SELECT count(*)::int FROM prices) AS prices,
    (SELECT count(*)::int FROM content_blocks) AS content`);
  console.log('Seeded OK', counts.rows?.[0] || counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
