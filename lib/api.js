import { NextResponse } from 'next/server';

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(err, fallback = 500) {
  const status = err.status || fallback;
  return NextResponse.json({ error: err.message || 'Server error' }, { status });
}
