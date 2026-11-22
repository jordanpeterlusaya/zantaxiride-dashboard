'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from './Toast';
import { useToast } from './useToast';

function linesToArr(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function ratesToText(rates) {
  return (rates || []).map((r) => `${r.label || ''}|${r.price || ''}`).join('\n');
}

function textToRates(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split('|');
      return { label: (label || '').trim(), price: rest.join('|').trim() };
    });
}

export default function PackageEditor({ kind, initial, isNew }) {
  const router = useRouter();
  const { message, show } = useToast();
  const [form, setForm] = useState({
    slug: initial?.slug || '',
    title: initial?.title || '',
    eyebrow: initial?.eyebrow || '',
    image: initial?.image || '',
    summary: initial?.summary || '',
    includes: initial?.includes || '',
    excludes: initial?.excludes || '',
    booking_item: initial?.booking_item || '',
    sort_order: initial?.sort_order ?? 0,
    active: initial?.active !== false,
    notesText: (initial?.notes || []).join('\n'),
    ratesText: ratesToText(initial?.rates || []),
  });
  const [saving, setSaving] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        slug: form.slug,
        title: form.title,
        eyebrow: form.eyebrow,
        image: form.image,
        summary: form.summary,
        includes: form.includes,
        excludes: form.excludes,
        booking_item: form.booking_item || form.title,
        sort_order: Number(form.sort_order) || 0,
        active: !!form.active,
        notes: linesToArr(form.notesText),
        rates: textToRates(form.ratesText),
      };
      const url = isNew
        ? `/api/admin/${kind}`
        : `/api/admin/${kind}/${initial.id}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      show('Saved');
      const id = data.tour?.id || data.safari?.id || initial?.id;
      router.replace(`/${kind}/${id}`);
      router.refresh();
    } catch (err) {
      show(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initial?.id) return;
    if (!window.confirm('Delete this package?')) return;
    const res = await fetch(`/api/admin/${kind}/${initial.id}`, { method: 'DELETE' });
    if (!res.ok) {
      show('Delete failed');
      return;
    }
    router.replace(`/${kind}`);
    router.refresh();
  }

  return (
    <div className="stack">
      <div className="topbar">
        <div>
          <div className="h1">{isNew ? `New ${kind.slice(0, -1)}` : 'Edit package'}</div>
          <div className="muted">{form.title || 'Untitled'}</div>
        </div>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => router.back()}>Back</button>
      </div>

      <div className="card stack">
        <div>
          <label className="label">Title</label>
          <input className="field" value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="grid2">
          <div>
            <label className="label">Slug</label>
            <input className="field" value={form.slug} onChange={(e) => set('slug', e.target.value)} />
          </div>
          <div>
            <label className="label">Sort</label>
            <input className="field" type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          </div>
        </div>
        {kind === 'tours' ? (
          <div>
            <label className="label">Eyebrow</label>
            <input className="field" value={form.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} />
          </div>
        ) : null}
        <div>
          <label className="label">Image path or URL</label>
          <input className="field" value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="assets/tours/..." />
        </div>
        <div>
          <label className="label">Summary</label>
          <textarea className="area" value={form.summary} onChange={(e) => set('summary', e.target.value)} />
        </div>
        <div>
          <label className="label">Includes</label>
          <textarea className="area" value={form.includes} onChange={(e) => set('includes', e.target.value)} />
        </div>
        {kind === 'tours' ? (
          <div>
            <label className="label">Excludes</label>
            <textarea className="area" value={form.excludes} onChange={(e) => set('excludes', e.target.value)} />
          </div>
        ) : null}
        <div>
          <label className="label">Notes (one per line)</label>
          <textarea className="area" value={form.notesText} onChange={(e) => set('notesText', e.target.value)} />
        </div>
        <div>
          <label className="label">Rates — label|price per line</label>
          <textarea className="area" value={form.ratesText} onChange={(e) => set('ratesText', e.target.value)} placeholder="2 people|190" />
        </div>
        <div>
          <label className="label">Booking item name</label>
          <input className="field" value={form.booking_item} onChange={(e) => set('booking_item', e.target.value)} />
        </div>
        <label className="row" style={{ justifyContent: 'flex-start', gap: 10 }}>
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
          <span>Active on website</span>
        </label>
      </div>

      <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
      {!isNew ? <button className="btn btn-danger" onClick={remove}>Delete package</button> : null}
      <Toast message={message} />
    </div>
  );
}
