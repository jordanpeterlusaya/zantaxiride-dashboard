'use client';

import { useState } from 'react';
import { previewSrc } from '../lib/preview';

export { previewSrc };

async function compressPhoto(file) {
  if (!file) throw new Error('Choose a photo');
  const named = /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(file.name || '');
  if (file.type && !file.type.startsWith('image/') && !named) {
    throw new Error('Choose a photo');
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (file.size > 2_500_000) throw new Error('That photo is too large');
    return file;
  }
  const max = 1400;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob) throw new Error('Could not prepare that photo');
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}

export default function ImagePicker({ value, onChange, alt = '' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const photo = await compressPhoto(file);
      const body = new FormData();
      body.append('file', photo);
      body.append('alt', alt || '');
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onChange(data.url);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  const src = previewSrc(value);

  return (
    <div className="picker">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="picker-preview" src={src} alt="" />
      ) : (
        <div className="picker-empty">No photo yet</div>
      )}
      <label className={`btn btn-secondary${busy ? ' is-disabled' : ''}`}>
        {busy ? 'Uploading…' : src ? 'Change photo' : 'Add photo'}
        <input className="file-input" type="file" accept="image/*" onChange={onFile} disabled={busy} />
      </label>
      {src ? (
        <button className="btn btn-danger" type="button" onClick={() => onChange('')}>
          Remove photo
        </button>
      ) : null}
      {error ? <p className="err">{error}</p> : null}
    </div>
  );
}
