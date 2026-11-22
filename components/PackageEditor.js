'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from './Toast';
import { useToast } from './useToast';
import ImagePicker from './ImagePicker';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function linesToArr(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function PackageEditor({ kind, initial, isNew }) {
  const router = useRouter();
  const { message, show } = useToast();
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
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
    notesText: Array.isArray(initial?.notes) ? initial.notes.join('\n') : '',
    rates: Array.isArray(initial?.rates) && initial.rates.length
      ? initial.rates.map((r) => ({ label: r.label || '', price: r.price || '' }))
      : [{ label: '', price: '' }],
  });
  const [saving, setSaving] = useState(false);
  const noun = kind === 'safaris' ? 'safari' : 'tour';

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setTitle(value) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  }

  function setRate(index, key, value) {
    setForm((f) => ({
      ...f,
      rates: f.rates.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const rates = form.rates
        .map((r) => ({ label: String(r.label || '').trim(), price: String(r.price || '').trim() }))
        .filter((r) => r.label || r.price);
      const payload = {
        slug: form.slug || slugify(form.title),
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
        rates,
      };
      const url = isNew ? `/api/admin/${kind}` : `/api/admin/${kind}/${initial.id}`;
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
    if (!window.confirm(`Delete this ${noun}?`)) return;
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
          <div className="h1">{isNew ? `New ${noun}` : 'Edit'}</div>
          <div className="muted">{form.title || 'Add a name, a photo, and the price'}</div>
        </div>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => router.back()}>Back</button>
      </div>

      <div className="card stack">
        <div>
          <label className="label">Name</label>
          <input className="field" value={form.title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Prison Island" />
        </div>
        <div>
          <label className="label">Photo</label>
          <ImagePicker value={form.image} onChange={(url) => set('image', url)} alt={form.title} />
        </div>
        <div>
          <label className="label">Short description</label>
          <textarea className="area" value={form.summary} onChange={(e) => set('summary', e.target.value)} placeholder="What guests should know" />
        </div>
        <div>
          <label className="label">Prices</label>
          <div className="stack">
            {form.rates.map((row, i) => (
              <div className="rate-row" key={i}>
                <input className="field" value={row.label} placeholder="2 people" onChange={(e) => setRate(i, 'label', e.target.value)} />
                <input className="field" value={row.price} inputMode="decimal" placeholder="190" onChange={(e) => setRate(i, 'price', e.target.value)} />
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => set('rates', form.rates.filter((_, idx) => idx !== i))} aria-label="Remove price">✕</button>
              </div>
            ))}
            <button className="btn btn-secondary" type="button" onClick={() => set('rates', [...form.rates, { label: '', price: '' }])}>
              Add price
            </button>
          </div>
        </div>
        <div>
          <label className="label">What is included</label>
          <textarea className="area" value={form.includes} onChange={(e) => set('includes', e.target.value)} />
        </div>
        {kind === 'tours' ? (
          <div>
            <label className="label">What is not included</label>
            <textarea className="area" value={form.excludes} onChange={(e) => set('excludes', e.target.value)} />
          </div>
        ) : null}
        <label className="switch">
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
          <span>{form.active ? 'Showing on the website' : 'Hidden from the website'}</span>
        </label>
      </div>

      <details className="card">
        <summary>More options</summary>
        <div className="stack" style={{ marginTop: 12 }}>
          <div>
            <label className="label">Extra notes, one per line</label>
            <textarea className="area" value={form.notesText} onChange={(e) => set('notesText', e.target.value)} />
          </div>
          <div className="grid2">
            <div>
              <label className="label">Link name</label>
              <input className="field" value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }} />
            </div>
            <div>
              <label className="label">Order</label>
              <input className="field" type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
            </div>
          </div>
          {kind === 'tours' ? (
            <div>
              <label className="label">Small heading</label>
              <input className="field" value={form.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} />
            </div>
          ) : null}
          <div>
            <label className="label">Name used on the booking form</label>
            <input className="field" value={form.booking_item} onChange={(e) => set('booking_item', e.target.value)} />
          </div>
        </div>
      </details>

      <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button>
      {!isNew ? <button className="btn btn-danger" onClick={remove}>Delete</button> : null}
      <Toast message={message} />
    </div>
  );
}
