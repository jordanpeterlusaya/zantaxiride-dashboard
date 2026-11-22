import { sql } from '../../../../lib/db';
import { notFound } from 'next/navigation';
import PackageEditor from '../../../../components/PackageEditor';

export default async function EditSafariPage({ params }) {
  const id = Number(params.id);
  if (!id) notFound();
  const rows = await sql`SELECT * FROM safaris WHERE id = ${id}`;
  if (!rows.length) notFound();
  return <PackageEditor kind="safaris" initial={rows[0]} />;
}
