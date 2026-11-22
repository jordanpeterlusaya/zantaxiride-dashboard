export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '../../lib/auth';
import BottomNav from '../../components/BottomNav';

export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return (
    <>
      <div className="app-shell">{children}</div>
      <BottomNav />
    </>
  );
}
