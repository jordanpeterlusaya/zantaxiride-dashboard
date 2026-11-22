'use client';

import { useEffect, useState } from 'react';
import Toast from '../../../components/Toast';
import { useToast } from '../../../components/useToast';

export default function MediaPage() {
  const { message, show } = useToast();
  const [media, setMedia] = useState([]);
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');

  async function load() {
    const res = await fetch('/api/admin/media');
    const data = await res.json();
    setMedia(data.media || []);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!url.trim()) return show('URL required');
    const res = await fetch('/api/admin/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim(), alt, kind: 'image' }),
    });
    if (!res.ok) return show('Add failed');
    setUrl(''); setAlt('');
    show('Added');
    await load();
  }

  async function remove(id) {
    if (!window.confirm('Remove this media item?')) return;
    await fetch(`/api/admin/media?id=${id}`, { method: 'DELETE' });
    show('Removed');
    await load();
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1 className="h1" style={{ margin: 0 }}>Media</h1>
          <div className="muted">Paste image URLs · use in packages</div>
        </div>
      </div>

      <div className="card stack">
        <div>
          <label className="label">Image URL</label>
          <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://... or assets/..." />
        </div>
        <div>
          <label className="label">Alt text</label>
          <input className="field" value={alt} onChange={(e) => setAlt(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={add}>Add media</button>
      </div>

      <div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {media.map((m) => (
          <div className="list-item" key={m.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="thumb" src={m.url.startsWith('http') ? m.url : `https://www.zantaxiride.com/${m.url}`} alt={m.alt || ''} />
            <div>
              <div className="title" style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>{m.url}</div>
              <div className="sub">{m.alt || m.kind}</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => remove(m.id)}>Del</button>
          </div>
        ))}
        {!media.length ? <p className="muted" style={{ padding: 12 }}>No media yet</p> : null}
      </div>
      <Toast message={message} />
    </div>
  );
}
