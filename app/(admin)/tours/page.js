export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { sql } from '../../../lib/db';
import { previewSrc } from '../../../lib/preview';

export default async function ToursPage() {
  const tours = await sql`SELECT id, slug, title, image, active, sort_order, rates FROM tours ORDER BY sort_order ASC, id ASC`;
  return (
    <div>
      <div className="topbar">
        <div>
          <h1 className="h1" style={{ margin: 0 }}>Tours</h1>
          <div className="muted">{tours.length} packages</div>
        </div>
        <Link className="btn btn-primary btn-sm" href="/tours/new">+ Add</Link>
      </div>
      <div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {tours.map((t) => {
          const raw = Array.isArray(t.rates) && t.rates[0] ? String(t.rates[0].price || '') : '';
          const clean = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const first = clean ? (clean.startsWith('$') ? clean : `$${clean}`) : '—';
          return (
            <Link key={t.id} href={`/tours/${t.id}`} className="list-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {previewSrc(t.image) ? <img className="thumb" src={previewSrc(t.image)} alt="" /> : <span className="thumb" />}
              <div>
                <div className="title">{t.title}</div>
                <div className="sub">{t.active ? first : 'Hidden'} · {t.slug}</div>
              </div>
              <span className={`pill${t.active ? ' ok' : ' warn'}`}>{t.active ? 'On' : 'Off'}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
