export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { sql } from '../../../lib/db';
import { clearSessionCookie } from '../../../lib/auth';
import { redirect } from 'next/navigation';

async function logoutAction() {
  'use server';
  await clearSessionCookie();
  redirect('/login');
}

export default async function DashboardPage() {
  const [tours] = await sql`SELECT count(*)::int AS n FROM tours`;
  const [safaris] = await sql`SELECT count(*)::int AS n FROM safaris`;
  const [media] = await sql`SELECT count(*)::int AS n FROM media`;
  const [prices] = await sql`SELECT updated_at FROM prices ORDER BY id DESC LIMIT 1`;

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="brand">Zantaxi<span>Ride</span></div>
          <div className="muted">Admin · phone CMS</div>
        </div>
        <form action={logoutAction}>
          <button className="btn btn-ghost btn-sm" type="submit">Logout</button>
        </form>
      </div>

      <h1 className="h1">Dashboard</h1>
      <p className="muted" style={{ marginTop: 0 }}>Edit prices, packages and site text from your phone.</p>

      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="stat"><div className="muted">Tours</div><div className="n">{tours.n}</div></div>
        <div className="stat"><div className="muted">Safaris</div><div className="n">{safaris.n}</div></div>
        <div className="stat"><div className="muted">Media</div><div className="n">{media.n}</div></div>
        <div className="stat"><div className="muted">Prices</div><div className="n" style={{ fontSize: '0.95rem' }}>{prices?.updated_at ? 'Live' : 'Empty'}</div></div>
      </div>

      <div className="section-title">Quick actions</div>
      <div className="stack">
        <Link className="card row" href="/prices"><div><div className="title">Edit taxi & tour prices</div><div className="sub">Airport, beach, sharing, safari rates</div></div><span>›</span></Link>
        <Link className="card row" href="/tours"><div><div className="title">Manage tour packages</div><div className="sub">Add, edit, delete, change photos</div></div><span>›</span></Link>
        <Link className="card row" href="/safaris"><div><div className="title">Manage safari packages</div><div className="sub">Mikumi, Serengeti, Selous…</div></div><span>›</span></Link>
        <Link className="card row" href="/content"><div><div className="title">Site text & media</div><div className="sub">Taglines, notes, image URLs</div></div><span>›</span></Link>
      </div>
    </div>
  );
}
