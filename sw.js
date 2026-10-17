const V='strata-v1',SHELL=['./','index.html','manifest.webmanifest','vendor/maplibre-gl.js','vendor/maplibre-gl.css','icons/icon-192.png','icons/icon-512.png'];
const EXT=['tiles.openfreemap.org','s3.amazonaws.com','fonts.googleapis.com','fonts.gstatic.com'],MAX=4000;
self.addEventListener('install',e=>e.waitUntil(caches.open(V+'-shell').then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>!k.startsWith(V)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const ok=r=>r&&(r.ok||r.type==='opaque');
async function trim(n){const c=await caches.open(n),ks=await c.keys();for(let i=0;i<ks.length-MAX;i++)await c.delete(ks[i]);}
async function swr(req,n){const c=await caches.open(n),hit=await c.match(req);const net=fetch(req).then(r=>{if(ok(r))c.put(req,r.clone());return r;}).catch(()=>null);return hit||(await net)||Response.error();}
async function netFirst(req,n){const c=await caches.open(n);try{const r=await fetch(req);if(ok(r))c.put(req,r.clone());return r;}catch(e){const hit=await c.match(req);return hit||Response.error();}}
async function cacheFirst(req,n){const c=await caches.open(n),hit=await c.match(req);if(hit)return hit;try{const r=await fetch(req);if(ok(r)){await c.put(req,r.clone());trim(n);}return r;}catch(e){return Response.error();}}
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET')return;const u=new URL(q.url);
  if(u.origin===location.origin){e.respondWith(q.mode==='navigate'?netFirst(q,V+'-shell').then(r=>r.type==='error'?caches.match('index.html'):r):swr(q,V+'-shell'));return;}
  if(!EXT.includes(u.hostname))return;
  if(u.hostname==='tiles.openfreemap.org'&&!/\.pbf$/.test(u.pathname)){e.respondWith(netFirst(q,V+'-map'));return;}
  if(u.hostname.startsWith('fonts.g')){e.respondWith(swr(q,V+'-fonts'));return;}
  e.respondWith(cacheFirst(q,V+'-map'));});
