'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/dashboard', label: 'Home', ico: '⌂' },
  { href: '/prices', label: 'Prices', ico: '$' },
  { href: '/tours', label: 'Tours', ico: '✈' },
  { href: '/safaris', label: 'Safari', ico: '◆' },
  { href: '/content', label: 'More', ico: '☰' },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav">
      {LINKS.map((l) => {
        const active = path === l.href || path.startsWith(l.href + '/');
        return (
          <Link key={l.href} href={l.href} className={`nav-link${active ? ' active' : ''}`}>
            <span className="nav-ico">{l.ico}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
