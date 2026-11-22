'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Toast from '../../../components/Toast';
import { useToast } from '../../../components/useToast';

export default function ContentPage() {
  const { message, show } = useToast();
  const [blocks, setBlocks] = useState([]);
  const [settings, setSettings] = useState({ brand: '', whatsapp: '', currency: 'USD' });
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newBody, setNewBody] = useState('');

  async function load() {
    const res = await fetch('/api/admin/content');
    const data = await res.json();
    setBlocks(data.blocks || []);
    setSettings(data.settings?.data || { brand: 'ZantaxiRide', whatsapp: '', currency: 'USD' });
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks, settings }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      show('Content saved');
      await load();
    } catch (err) {
      show(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function addBlock() {
    if (!newKey.trim()) return show('Key required');
    const next = [...blocks, { key: newKey.trim(), label: newLabel || newKey, body: newBody }];
    setBlocks(next);
    setNewKey(''); setNewLabel(''); setNewBody('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: next, settings }),
      });
      if (!res.ok) throw new Error('Add failed');
      show('Block added');
      await load();
    } catch (err) {
      show(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeBlock(id) {
    if (!window.confirm('Delete this text block?')) return;
    await fetch(`/api/admin/content?id=${id}`, { method: 'DELETE' });
    show('Deleted');
    await load();
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1 className="h1" style={{ margin: 0 }}>Website words</h1>
          <div className="muted">These words appear on the website. Use home_tagline, home_headline, about_story, footer_blurb, or whatsapp_note.</div>
        </div>
        <button className="btn btn-primary btn-sm" disabled={saving} onClick={save}>{saving ? '…' : 'Save'}</button>
      </div>

      <div className="card stack">
        <div className="h2">Settings</div>
        <div>
          <label className="label">Brand</label>
          <input className="field" value={settings.brand || ''} onChange={(e) => setSettings((s) => ({ ...s, brand: e.target.value }))} />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input className="field" value={settings.whatsapp || ''} onChange={(e) => setSettings((s) => ({ ...s, whatsapp: e.target.value }))} />
        </div>
        <div>
          <label className="label">Currency</label>
          <input className="field" value={settings.currency || ''} onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))} />
        </div>
      </div>

      <div className="section-title">Text blocks</div>
      {blocks.map((b, idx) => (
        <div className="card stack" key={b.id || b.key}>
          <div className="row">
            <div>
              <div className="title">{b.label || b.key}</div>
              <div className="sub">{b.key}</div>
            </div>
            {b.id ? <button className="btn btn-danger btn-sm" type="button" onClick={() => removeBlock(b.id)}>Delete</button> : null}
          </div>
          <textarea
            className="area"
            value={b.body || ''}
            onChange={(e) => {
              const val = e.target.value;
              setBlocks((list) => list.map((x, i) => (i === idx ? { ...x, body: val } : x)));
            }}
          />
        </div>
      ))}

      <div className="card stack">
        <div className="h2">Add text block</div>
        <input className="field" placeholder="key e.g. home_hero" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
        <input className="field" placeholder="Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
        <textarea className="area" placeholder="Body text" value={newBody} onChange={(e) => setNewBody(e.target.value)} />
        <button className="btn btn-secondary" type="button" onClick={addBlock}>Add block</button>
      </div>

      <Link className="card row" href="/media">
        <div>
          <div className="title">Photos</div>
          <div className="sub">Upload a photo from your phone or computer</div>
        </div>
        <span>›</span>
      </Link>

      <Toast message={message} />
    </div>
  );
}
