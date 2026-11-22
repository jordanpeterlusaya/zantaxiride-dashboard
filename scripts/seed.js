const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

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
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, name), 'utf8'));
}

async function main() {
  const prices = readJson('prices-seed.json');
  const tours = readJson('tours-seed.json');
  const safaris = readJson('safaris-seed.json');

  await sql`DELETE FROM prices`;
  await sql`INSERT INTO prices (data) VALUES (${JSON.stringify(prices)}::jsonb)`;

  await sql`DELETE FROM tours`;
  for (const t of tours) {
    const notes = Array.isArray(t.notes) ? t.notes : [];
    const rates = Array.isArray(t.rates) ? t.rates : [];
    await sql`
      INSERT INTO tours (slug, title, eyebrow, image, summary, includes, excludes, notes, rates, booking_item, active, sort_order)
      VALUES (
        ${t.slug}, ${t.title}, ${t.eyebrow || ''}, ${t.image || ''}, ${t.summary || ''},
        ${t.includes || ''}, ${t.excludes || ''},
        ${JSON.stringify(notes)}::jsonb, ${JSON.stringify(rates)}::jsonb,
        ${t.booking_item || t.title}, ${t.active !== false}, ${t.sort_order ?? 0}
      )
    `;
  }

  await sql`DELETE FROM safaris`;
  for (const s of safaris) {
    const notes = Array.isArray(s.notes) ? s.notes : [];
    const rates = Array.isArray(s.rates) ? s.rates : [];
    await sql`
      INSERT INTO safaris (slug, title, image, summary, includes, notes, rates, booking_item, active, sort_order)
      VALUES (
        ${s.slug}, ${s.title}, ${s.image || ''}, ${s.summary || s.eyebrow || ''}, ${s.includes || ''},
        ${JSON.stringify(notes)}::jsonb, ${JSON.stringify(rates)}::jsonb,
        ${s.booking_item || s.title}, ${s.active !== false}, ${s.sort_order ?? 0}
      )
    `;
  }

  await sql`DELETE FROM content_blocks`;
  const blocks = [
    { key: 'home_tagline', label: 'Home tagline', body: 'Airport transfers, private tours & safari from Zanzibar.' },
    { key: 'whatsapp_note', label: 'WhatsApp booking note', body: 'Send your pickup time and hotel name on WhatsApp after booking.' },
    { key: 'footer_blurb', label: 'Footer blurb', body: 'ZantaxiRide — reliable taxi, tours and safari in Zanzibar.' },
  ];
  for (const b of blocks) {
    await sql`INSERT INTO content_blocks (key, label, body) VALUES (${b.key}, ${b.label}, ${b.body})`;
  }

  await sql`DELETE FROM site_settings`;
  await sql`INSERT INTO site_settings (data) VALUES (${JSON.stringify({
    brand: 'ZantaxiRide',
    whatsapp: '+255777000000',
    currency: 'USD',
  })}::jsonb)`;

  const counts = await sql`
    SELECT
      (SELECT count(*)::int FROM tours) AS tours,
      (SELECT count(*)::int FROM safaris) AS safaris,
      (SELECT count(*)::int FROM prices) AS prices,
      (SELECT count(*)::int FROM content_blocks) AS content
  `;
  console.log('Seeded OK', counts[0]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
