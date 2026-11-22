export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { sql } from '../../../lib/db';
import { previewSrc } from '../../../lib/preview';

export default async function SafarisPage() {
  const safaris = await sql`SELECT id, slug, title, image, active, sort_order, rates FROM safaris ORDER BY sort_order ASC, id ASC`;
  return (
    <div>
      <div className="topbar">
        <div>
          <h1 className="h1" style={{ margin: 0 }}>Safaris</h1>
          <div className="muted">{safaris.length} packages</div>
        </div>
        <Link className="btn btn-primary btn-sm" href="/safaris/new">+ Add</Link>
      </div>
      <div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {safaris.map((s) => {
          const first = Array.isArray(s.rates) && s.rates[0] ? `$${s.rates[0].price}` : '—';
          return (
            <Link key={s.id} href={`/safaris/${s.id}`} className="list-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {previewSrc(s.image) ? <img className="thumb" src={previewSrc(s.image)} alt="" /> : <span className="thumb" />}
              <div>
                <div className="title">{s.title}</div>
                <div className="sub">{s.active ? first : 'Hidden'} · {s.slug}</div>
              </div>
              <span className={`pill${s.active ? ' ok' : ' warn'}`}>{s.active ? 'On' : 'Off'}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
