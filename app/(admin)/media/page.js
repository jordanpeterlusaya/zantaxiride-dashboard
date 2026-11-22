'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Toast from '../../../components/Toast';
import { useToast } from '../../../components/useToast';
import ImagePicker, { previewSrc } from '../../../components/ImagePicker';

export default function MediaPage() {
  const { message, show } = useToast();
  const [media, setMedia] = useState([]);
  const [alt, setAlt] = useState('');
  const [draft, setDraft] = useState('');

  async function load() {
    const res = await fetch('/api/admin/media');
    const data = await res.json();
    setMedia(data.media || []);
  }

  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!window.confirm('Remove this photo?')) return;
    await fetch(`/api/admin/media?id=${id}`, { method: 'DELETE' });
    show('Removed');
    await load();
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1 className="h1" style={{ margin: 0 }}>Photos</h1>
          <div className="muted">Take or choose a photo. It is ready to use on a tour.</div>
        </div>
      </div>

      <div className="card stack">
        <label className="label">What is in the photo</label>
        <input className="field" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Stone Town sunset" />
        <ImagePicker
          value={draft}
          alt={alt}
          onChange={(url) => {
            if (!url) {
              setDraft('');
              return;
            }
            setDraft('');
            setAlt('');
            show('Photo added');
            load();
          }}
        />
      </div>

      <div className="photo-grid">
        {media.map((m) => (
          <article className="photo-card" key={m.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc(m.url)} alt={m.alt || ''} />
            <div className="photo-card-body">
              <div className="title">{m.alt || 'Photo'}</div>
              <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(m.id)}>Remove</button>
            </div>
          </article>
        ))}
      </div>
      {!media.length ? <p className="muted">No photos yet.</p> : null}

      <Link className="card row" href="/content" style={{ marginTop: 16 }}>
        <div>
          <div className="title">Website words</div>
          <div className="sub">Tagline, WhatsApp note, and footer text</div>
        </div>
        <span>›</span>
      </Link>
      <Toast message={message} />
    </div>
  );
}
