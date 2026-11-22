'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/dashboard', label: 'Home', icon: 'home' },
  { href: '/prices', label: 'Prices', icon: 'tag' },
  { href: '/tours', label: 'Tours', icon: 'map' },
  { href: '/safaris', label: 'Safari', icon: 'sun' },
  { href: '/media', label: 'Photos', icon: 'photo' },
  { href: '/content', label: 'Words', icon: 'text' },
];

function Icon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'home') return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></svg>;
  if (name === 'tag') return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M12 3h7a1 1 0 0 1 1 1v7l-9.5 9.5a1.5 1.5 0 0 1-2.1 0L3.5 15.6a1.5 1.5 0 0 1 0-2.1z" /><circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none" /></svg>;
  if (name === 'map') return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M9 4 3 6.5V20l6-2.5L15 20l6-2.5V4L15 6.5z" /><path {...common} d="M9 4v13.5M15 6.5V20" /></svg>;
  if (name === 'sun') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle {...common} cx="12" cy="12" r="3.5" /><path {...common} d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>;
  if (name === 'photo') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect {...common} x="3" y="5" width="18" height="14" rx="2" /><circle {...common} cx="9" cy="10" r="1.5" /><path {...common} d="m21 16-4.5-4.5L7 20" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M5 6h14M5 12h14M5 18h9" /></svg>;
}

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Main">
      <div className="side-brand">
        <div className="brand">Zantaxi<span>Ride</span></div>
        <div className="muted">Admin</div>
      </div>
      {LINKS.map((l) => {
        const active = path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link key={l.href} href={l.href} className={`nav-link${active ? ' active' : ''}`}>
            <span className="nav-ico"><Icon name={l.icon} /></span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
