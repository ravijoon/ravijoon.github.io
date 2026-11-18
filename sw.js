// The service worker of the GitHub Pages website.
// GitHub Pages holds only encrypted files. This worker decrypts them in the browser of a visitor who gave the password.
// It has no password and no key of its own: the password page puts the keys in IndexedDB.
const BASE = new URL('./', self.location).pathname;
const MAX_AGE = Number(new URL(self.location).searchParams.get('days') || 30) * 24 * 60 * 60 * 1000;
const text = new TextEncoder();
const TYPES = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  ico: 'image/x-icon',
  woff2: 'font/woff2',
  pdf: 'application/pdf',
};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('message', (event) => {
  if (event.data === 'keys-changed') held = null;
});

const store = (mode, run) =>
  new Promise((resolve, reject) => {
    const open = indexedDB.open('portfolio-lock', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('keys');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const tx = open.result.transaction('keys', mode);
      const request = run(tx.objectStore('keys'));
      tx.oncomplete = () => (open.result.close(), resolve(request.result));
      tx.onerror = () => (open.result.close(), reject(tx.error));
    };
  });

let held = null;
async function keys() {
  if (!held) held = (await store('readonly', (s) => s.get('current')).catch(() => null)) || null;
  if (held && Date.now() - held.at > MAX_AGE) {
    held = null;
    await store('readwrite', (s) => s.delete('current')).catch(() => {});
  }
  return held;
}

const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function open(key, path) {
  const name = hex(await crypto.subtle.sign('HMAC', key.mac, text.encode('name:' + path))).slice(0, 40);
  const response = await fetch(BASE + 'd/' + name);
  if (!response.ok) return response.status === 404 ? null : response;
  const data = await response.arrayBuffer();
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: data.slice(0, 12), additionalData: text.encode(path) },
    key.enc,
    data.slice(12),
  );
  const type = TYPES[path.slice(path.lastIndexOf('.') + 1).toLowerCase()] || 'application/octet-stream';
  return new Response(plain, {
    headers: { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' },
  });
}

async function answer(request, rel) {
  const key = await keys();
  // No keys: GitHub Pages sends the password page (or an open file, such as the icon).
  if (!key) return fetch(request);

  let path = decodeURIComponent(rel);
  if (path === '' || path.endsWith('/')) path += 'index.html';
  else if (!/\.[a-z0-9]+$/i.test(path)) path += '/index.html';

  try {
    // No encrypted file with this name: the file is open, or it does not exist.
    return (await open(key, path)) || fetch(request);
  } catch {
    // The keys do not open the file: the owner changed the password. Ask for it again.
    if (request.mode !== 'navigate') return new Response('', { status: 403 });
    held = null;
    await store('readwrite', (s) => s.delete('current')).catch(() => {});
    return fetch(BASE);
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  const rel = url.pathname.slice(BASE.length);
  if (rel === 'sw.js' || rel === 'lock.json' || rel.startsWith('d/')) return;
  event.respondWith(answer(request, rel));
});
