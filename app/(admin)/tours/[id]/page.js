import { sql } from '../../../../lib/db';
import { notFound } from 'next/navigation';
import PackageEditor from '../../../../components/PackageEditor';

export default async function EditTourPage({ params }) {
  const id = Number(params.id);
  if (!id) notFound();
  const rows = await sql`SELECT * FROM tours WHERE id = ${id}`;
  if (!rows.length) notFound();
  return <PackageEditor kind="tours" initial={rows[0]} />;
}
