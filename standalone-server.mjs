import http from 'http';
import https from 'https';
import fs from 'fs';
import crypto from 'crypto';
import { URL } from 'url';

const env = {};
for (const line of fs.readFileSync(new URL('./.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !process.env[m[1].trim()]) env[m[1].trim()] = m[2].trim();
}
const DATABASE_URL = env.DATABASE_URL;
const ADMIN_USER = env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = env.ADMIN_PASSWORD || 'admin';
const SECRET = env.AUTH_SECRET || 'dev';
const host = new URL(DATABASE_URL.replace(/^postgresql:/, 'https:')).hostname;

function neon(query, params = []) {
  const body = JSON.stringify({ query, params });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: host, path: '/sql', method: 'POST', family: 4, timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String': DATABASE_URL,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(d.slice(0, 300)));
        try { resolve(JSON.parse(d).rows || []); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sign(user) {
  const exp = Date.now() + 7 * 864e5;
  const body = Buffer.from(JSON.stringify({ u: user, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function session(req) {
  const raw = (req.headers.cookie || '').split(';').map((s) => s.trim()).find((s) => s.startsWith('ztr_admin='));
  if (!raw) return null;
  const token = decodeURIComponent(raw.slice('ztr_admin='.length));
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (expected !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
}

function readBody(req) {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => {
      try { resolve(d ? JSON.parse(d) : {}); } catch { resolve({}); }
    });
  });
}
function send(res, code, obj, extra = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...extra });
  res.end(body);
}

const HTML = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>ZantaxiRide Admin</title>
<style>
:root{--bg:#0b1220;--card:#182338;--line:rgba(255,255,255,.08);--text:#f4f7fb;--muted:#9aa7bd;--accent:#f0b429;--danger:#e25555}
*{box-sizing:border-box}body{margin:0 auto;max-width:480px;min-height:100dvh;background:radial-gradient(120% 70% at 50% -10%,rgba(240,180,41,.18),transparent 50%),#0b1220;color:var(--text);font:16px/1.4 system-ui,sans-serif;padding:16px 16px 92px}
h1{font-size:1.45rem;margin:0 0 6px}button,input,textarea,select{font:inherit;color:inherit}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;margin:10px 0}
label{display:block;color:var(--muted);font-size:.78rem;margin:8px 0 4px}
input,textarea,select{width:100%;background:#121a2b;border:1px solid var(--line);border-radius:12px;padding:12px}
textarea{min-height:90px}
.btn{width:100%;min-height:48px;border:0;border-radius:14px;background:var(--accent);color:#1a1406;font-weight:800;margin-top:10px}
.ghost{background:transparent;border:1px solid var(--line);color:var(--text)}
.danger{background:rgba(226,85,85,.18);color:#ffb4b4}
.row{display:flex;justify-content:space-between;gap:8px;align-items:center}
.muted{color:var(--muted);font-size:.88rem}
.nav{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:min(480px,100%);display:grid;grid-template-columns:repeat(4,1fr);background:rgba(12,18,30,.94);border-top:1px solid var(--line);padding:8px 6px calc(8px + env(safe-area-inset-bottom))}
.nav button{background:transparent;border:0;color:var(--muted);min-height:48px}
.nav button.on{color:var(--accent)}
.price{display:grid;grid-template-columns:1fr 90px;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)}
.err{color:#ffb4b4}
</style></head><body>
<div id="app"></div>
<nav class="nav" id="nav" hidden>
<button data-tab="home">Home</button><button data-tab="prices">Prices</button><button data-tab="tours">Tours</button><button data-tab="safari">Safari</button>
</nav>
<script>
const $ = (h) => document.getElementById('app').innerHTML = h;
let tab = 'home';
async function api(url, opt){
  const r = await fetch(url, Object.assign({headers:{'Content-Type':'application/json'}}, opt||{}));
  const d = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error||'Failed');
  return d;
}
function login(){
  document.getElementById('nav').hidden = true;
  $(\`<form class="card" id="f"><h1>ZantaxiRide</h1><p class="muted">Admin · phone</p>
    <label>Username</label><input name="u" value="admin" autocomplete="username">
    <label>Password</label><input name="p" type="password" autocomplete="current-password">
    <p class="err" id="e"></p><button class="btn">Sign in</button></form>\`);
  document.getElementById('f').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try { await api('/api/auth/login',{method:'POST',body:JSON.stringify({username:fd.get('u'),password:fd.get('p')})}); show('home'); }
    catch(err){ document.getElementById('e').textContent = err.message; }
  };
}
async function show(name){
  tab = name; document.getElementById('nav').hidden = false;
  [...document.querySelectorAll('.nav button')].forEach(b => b.classList.toggle('on', b.dataset.tab===name));
  try {
    if(name==='home'){
      const d = await api('/api/admin/stats');
      $(\`<h1>Dashboard</h1><p class="muted">Edit prices, tours and safari from your phone.</p>
        <div class="card"><b>\${d.tours}</b> tours · <b>\${d.safaris}</b> safaris · prices \${d.prices? 'live':'empty'}</div>
        <button class="btn ghost" id="out">Logout</button>\`);
      document.getElementById('out').onclick = async () => { await api('/api/auth/logout',{method:'POST',body:'{}'}); login(); };
    }
    if(name==='prices'){
      const d = await api('/api/admin/prices');
      const p = d.prices;
      const places = Object.entries(p.privateAirport.alphard).map(([k,v]) => \`<div class="price"><span>\${k}</span><input data-place="\${k}" type="number" value="\${v}"></div>\`).join('');
      $(\`<h1>Prices</h1><p class="muted">Airport Alphard / Noah · USD</p><div class="card">\${places}
        <label>Night surcharge</label><input id="night" type="number" value="\${p.nightSurchargeUsd}"></div>
        <button class="btn" id="save">Save prices</button><p class="muted" id="msg"></p>\`);
      document.getElementById('save').onclick = async () => {
        document.querySelectorAll('[data-place]').forEach(el => { p.privateAirport.alphard[el.dataset.place] = Number(el.value); });
        p.nightSurchargeUsd = Number(document.getElementById('night').value);
        await api('/api/admin/prices',{method:'PUT',body:JSON.stringify(p)});
        document.getElementById('msg').textContent = 'Saved. Website picks this up automatically.';
      };
    }
    if(name==='tours' || name==='safari'){
      const kind = name==='tours' ? 'tours' : 'safaris';
      const d = await api('/api/admin/'+kind);
      const items = d[kind];
      $(\`<h1>\${name==='tours'?'Tours':'Safari'}</h1><div id="list"></div><button class="btn" id="add">Add package</button>\`);
      const list = document.getElementById('list');
      items.forEach(item => {
        const box = document.createElement('div');
        box.className = 'card';
        const rates = (item.rates||[]).map(r => r.label+'|'+r.price).join('\\n');
        box.innerHTML = \`<b>\${item.title}</b><label>Title</label><input data-k="title" value="\${item.title}">
          <label>Image</label><input data-k="image" value="\${item.image||''}">
          <label>Rates label|price</label><textarea data-k="rates">\${rates}</textarea>
          <label><input data-k="active" type="checkbox" \${item.active?'checked':''}> Active</label>
          <button class="btn" data-act="save">Save</button>
          <button class="btn danger" data-act="del">Delete</button>\`;
        box.querySelector('[data-act=save]').onclick = async () => {
          const title = box.querySelector('[data-k=title]').value;
          const image = box.querySelector('[data-k=image]').value;
          const rates = box.querySelector('[data-k=rates]').value.split('\\n').filter(Boolean).map(line => {
            const [label,...rest] = line.split('|'); return {label:label.trim(), price:rest.join('|').trim()};
          });
          await api('/api/admin/'+kind+'/'+item.id,{method:'PUT',body:JSON.stringify({...item,title,image,rates,active:box.querySelector('[data-k=active]').checked})});
          alert('Saved');
        };
        box.querySelector('[data-act=del]').onclick = async () => {
          if(!confirm('Delete?')) return;
          await api('/api/admin/'+kind+'/'+item.id,{method:'DELETE'});
          show(name);
        };
        list.appendChild(box);
      });
      document.getElementById('add').onclick = async () => {
        const title = prompt('Package title'); if(!title) return;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        await api('/api/admin/'+kind,{method:'POST',body:JSON.stringify({slug,title,image:'',rates:[],notes:[],active:true,sort_order:99})});
        show(name);
      };
    }
  } catch(err){ if(/Unauthorized/i.test(err.message)) return login(); $(\`<p class="err">\${err.message}</p>\`); }
}
document.getElementById('nav').onclick = (e) => { if(e.target.dataset.tab) show(e.target.dataset.tab); };
api('/api/admin/stats').then(()=>show('home')).catch(()=>login());
</script></body></html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'OPTIONS') { res.writeHead(204, {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS'}); return res.end(); }
  try {
    if (url.pathname === '/' ) { res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); return res.end(HTML); }
    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const b = await readBody(req);
      if (b.username !== ADMIN_USER || b.password !== ADMIN_PASS) return send(res, 401, {error:'Invalid username or password'});
      return send(res, 200, {ok:true}, {'Set-Cookie': `ztr_admin=${sign(b.username)}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`});
    }
    if (url.pathname === '/api/auth/logout') {
      return send(res, 200, {ok:true}, {'Set-Cookie':'ztr_admin=; HttpOnly; Path=/; Max-Age=0'});
    }
    if (url.pathname === '/api/public/prices' && req.method === 'GET') {
      const rows = await neon('SELECT data FROM prices ORDER BY id DESC LIMIT 1');
      return send(res, 200, {prices: rows[0]?.data || null});
    }
    if (!session(req) && url.pathname.startsWith('/api/admin')) return send(res, 401, {error:'Unauthorized'});
    if (url.pathname === '/api/admin/stats') {
      const [t] = await neon('SELECT count(*)::int n FROM tours');
      const [s] = await neon('SELECT count(*)::int n FROM safaris');
      const p = await neon('SELECT id FROM prices LIMIT 1');
      return send(res, 200, {tours:t.n, safaris:s.n, prices:p.length});
    }
    if (url.pathname === '/api/admin/prices' && req.method === 'GET') {
      const rows = await neon('SELECT data FROM prices ORDER BY id DESC LIMIT 1');
      return send(res, 200, {prices: rows[0]?.data});
    }
    if (url.pathname === '/api/admin/prices' && req.method === 'PUT') {
      const b = await readBody(req);
      await neon('UPDATE prices SET data = $1::jsonb, updated_at = now() WHERE id = (SELECT id FROM prices ORDER BY id DESC LIMIT 1)', [JSON.stringify(b)]);
      return send(res, 200, {ok:true});
    }
    const list = url.pathname.match(/^\/api\/admin\/(tours|safaris)$/);
    if (list && req.method === 'GET') {
      const table = list[1];
      const rows = await neon(`SELECT * FROM ${table} ORDER BY sort_order, id`);
      return send(res, 200, {[table]: rows});
    }
    if (list && req.method === 'POST') {
      const table = list[1];
      const b = await readBody(req);
      if (table === 'tours') {
        await neon(`INSERT INTO tours (slug,title,eyebrow,image,summary,includes,excludes,notes,rates,booking_item,active,sort_order)
          VALUES ($1,$2,'',$3,'','','',$4::jsonb,$5::jsonb,$2,$6,$7)`,
          [b.slug, b.title, b.image||'', JSON.stringify(b.notes||[]), JSON.stringify(b.rates||[]), b.active!==false, b.sort_order||99]);
      } else {
        await neon(`INSERT INTO safaris (slug,title,image,summary,includes,notes,rates,booking_item,active,sort_order)
          VALUES ($1,$2,$3,'','',$4::jsonb,$5::jsonb,$2,$6,$7)`,
          [b.slug, b.title, b.image||'', JSON.stringify(b.notes||[]), JSON.stringify(b.rates||[]), b.active!==false, b.sort_order||99]);
      }
      return send(res, 201, {ok:true});
    }
    const one = url.pathname.match(/^\/api\/admin\/(tours|safaris)\/(\d+)$/);
    if (one && req.method === 'PUT') {
      const table = one[1];
      const id = Number(one[2]);
      const b = await readBody(req);
      await neon(`UPDATE ${table} SET title=$1, image=$2, rates=$3::jsonb, active=$4, updated_at=now() WHERE id=$5`,
        [b.title, b.image||'', JSON.stringify(b.rates||[]), !!b.active, id]);
      return send(res, 200, {ok:true});
    }
    if (one && req.method === 'DELETE') {
      await neon(`DELETE FROM ${one[1]} WHERE id=$1`, [Number(one[2])]);
      return send(res, 200, {ok:true});
    }
    send(res, 404, {error:'Not found'});
  } catch (err) {
    send(res, 500, {error: err.message || 'error'});
  }
});

server.listen(3010, '0.0.0.0', () => console.log('DASHBOARD http://0.0.0.0:3010'));
