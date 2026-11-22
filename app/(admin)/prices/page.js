'use client';

import { useEffect, useState } from 'react';
import Toast from '../../../components/Toast';
import { useToast } from '../../../components/useToast';

const TABS = [
  { id: 'airport', label: 'Airport' },
  { id: 'beach', label: 'Beach' },
  { id: 'sharing', label: 'Sharing' },
  { id: 'tours', label: 'Tours' },
  { id: 'safari', label: 'Safari $' },
  { id: 'raw', label: 'Advanced' },
];

function deepSet(obj, path, value) {
  const clone = structuredClone(obj);
  let cur = clone;
  for (let i = 0; i < path.length - 1; i++) {
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = value;
  return clone;
}

export default function PricesPage() {
  const { message, show } = useToast();
  const [prices, setPrices] = useState(null);
  const [tab, setTab] = useState('airport');
  const [vehicle, setVehicle] = useState('alphard');
  const [raw, setRaw] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/prices')
      .then((r) => r.json())
      .then((d) => {
        setPrices(d.prices || {});
        setRaw(JSON.stringify(d.prices || {}, null, 2));
      })
      .catch(() => setError('Failed to load prices'));
  }, []);

  async function save(next) {
    setSaving(true);
    setError('');
    try {
      const payload = next || prices;
      const res = await fetch('/api/admin/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setPrices(payload);
      setRaw(JSON.stringify(payload, null, 2));
      show('Prices saved');
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function saveRaw() {
    try {
      const parsed = JSON.parse(raw);
      save(parsed);
    } catch {
      setError('Invalid JSON');
    }
  }

  if (!prices) {
    return <div className="muted">Loading prices…</div>;
  }

  const airport = prices.privateAirport?.[vehicle] || {};
  const beach = prices.privateBeach || {};
  const sharing = prices.sharing?.vehicles || {};
  const tours = prices.tours || {};
  const safari = prices.safari || {};

  return (
    <div>
      <div className="topbar">
        <div>
          <h1 className="h1" style={{ margin: 0 }}>Prices</h1>
          <div className="muted">Tap a number to edit · USD</div>
        </div>
        <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => (tab === 'raw' ? saveRaw() : save())}>
          {saving ? '…' : 'Save'}
        </button>
      </div>

      <div className="chip-row">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`chip${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p className="err">{error}</p> : null}

      {tab === 'airport' ? (
        <div className="card">
          <div className="chip-row">
            {['alphard', 'hiace', 'coaster'].map((v) => (
              <button key={v} type="button" className={`chip${vehicle === v ? ' on' : ''}`} onClick={() => setVehicle(v)}>
                {v}
              </button>
            ))}
          </div>
          <div className="muted" style={{ marginBottom: 8 }}>Airport / ferry ↔ place · Alphard rates also used for Noah</div>
          {Object.entries(airport).map(([place, fare]) => (
            <div className="price-row" key={place}>
              <div>
                <div className="title" style={{ fontSize: '0.92rem' }}>{place}</div>
              </div>
              <input
                className="field"
                type="number"
                value={fare}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setPrices((p) => deepSet(p, ['privateAirport', vehicle, place], n));
                }}
              />
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <label className="label">Night surcharge (USD)</label>
            <input
              className="field"
              type="number"
              value={prices.nightSurchargeUsd ?? 0}
              onChange={(e) => setPrices((p) => ({ ...p, nightSurchargeUsd: Number(e.target.value) }))}
            />
          </div>
        </div>
      ) : null}

      {tab === 'beach' ? (
        <div className="card">
          {Object.entries(beach).map(([zone, fares]) => (
            <div key={zone} style={{ marginBottom: 14 }}>
              <div className="h2">{zone}</div>
              {Object.entries(fares || {}).map(([v, fare]) => (
                <div className="price-row" key={v}>
                  <div className="title" style={{ fontSize: '0.92rem' }}>{v}</div>
                  <input
                    className="field"
                    type="number"
                    value={fare}
                    onChange={(e) => setPrices((p) => deepSet(p, ['privateBeach', zone, v], Number(e.target.value)))}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'sharing' ? (
        <div className="card stack">
          {Object.entries(sharing).map(([v, cfg]) => (
            <div key={v}>
              <div className="h2">{v}</div>
              {'seatPriceStn' in (cfg || {}) ? (
                <>
                  <div className="price-row">
                    <div>Seat STN</div>
                    <input className="field" type="number" value={cfg.seatPriceStn}
                      onChange={(e) => setPrices((p) => deepSet(p, ['sharing', 'vehicles', v, 'seatPriceStn'], Number(e.target.value)))} />
                  </div>
                  <div className="price-row">
                    <div>Seat Beach</div>
                    <input className="field" type="number" value={cfg.seatPriceBeach}
                      onChange={(e) => setPrices((p) => deepSet(p, ['sharing', 'vehicles', v, 'seatPriceBeach'], Number(e.target.value)))} />
                  </div>
                </>
              ) : null}
              {cfg?.totalsStn ? Object.entries(cfg.totalsStn).map(([k, val]) => (
                <div className="price-row" key={`stn-${k}`}>
                  <div>STN total · {k} seat</div>
                  <input className="field" type="number" value={val}
                    onChange={(e) => setPrices((p) => deepSet(p, ['sharing', 'vehicles', v, 'totalsStn', k], Number(e.target.value)))} />
                </div>
              )) : null}
              {cfg?.totalsBeach ? Object.entries(cfg.totalsBeach).map(([k, val]) => (
                <div className="price-row" key={`beach-${k}`}>
                  <div>Beach total · {k} seat</div>
                  <input className="field" type="number" value={val}
                    onChange={(e) => setPrices((p) => deepSet(p, ['sharing', 'vehicles', v, 'totalsBeach', k], Number(e.target.value)))} />
                </div>
              )) : null}
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'tours' ? (
        <div className="card">
          {Object.entries(tours).map(([name, cfg]) => (
            <div key={name} style={{ marginBottom: 16 }}>
              <div className="h2">{name}</div>
              {cfg.pp != null ? (
                <div className="price-row">
                  <div>Per person</div>
                  <input className="field" type="number" value={cfg.pp}
                    onChange={(e) => setPrices((p) => deepSet(p, ['tours', name, 'pp'], Number(e.target.value)))} />
                </div>
              ) : null}
              {cfg.group ? Object.entries(cfg.group).map(([k, val]) => (
                <div className="price-row" key={k}>
                  <div>{k} pax</div>
                  <input className="field" type="number" value={val}
                    onChange={(e) => setPrices((p) => deepSet(p, ['tours', name, 'group', k], Number(e.target.value)))} />
                </div>
              )) : null}
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'safari' ? (
        <div className="card">
          {Object.entries(safari).map(([name, cfg]) => (
            <div key={name} style={{ marginBottom: 16 }}>
              <div className="h2">{name}</div>
              {Object.entries(cfg || {}).map(([k, val]) => (
                <div className="price-row" key={k}>
                  <div>{k}</div>
                  <input className="field" type="number" value={val}
                    onChange={(e) => setPrices((p) => deepSet(p, ['safari', name, k], Number(e.target.value)))} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'raw' ? (
        <div className="card stack">
          <label className="label">Full prices JSON</label>
          <textarea className="area" style={{ minHeight: 360, fontFamily: 'ui-monospace, monospace', fontSize: 12 }} value={raw} onChange={(e) => setRaw(e.target.value)} />
          <button className="btn btn-primary" disabled={saving} onClick={saveRaw}>{saving ? 'Saving…' : 'Save JSON'}</button>
        </div>
      ) : null}

      <Toast message={message} />
    </div>
  );
}
