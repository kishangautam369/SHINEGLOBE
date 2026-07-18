/* Shine Globe shared catalog server.
   Run with: node server.js  (then open http://localhost:3000) */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const STORE_DIR = path.join(ROOT, 'data');
const STORE_FILE = path.join(STORE_DIR, 'store.json');
const EVENT_CLIENTS = new Set();

function readJson(file){ return JSON.parse(fs.readFileSync(file, 'utf8')); }
function defaultStore(){
  const products = readJson(path.join(ROOT, 'assets', 'data', 'products.json'));
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].map((name, index) => ({
    id: index + 1, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    desc: name, icon: 'fa-tag', color: '#2563EB', banner: '', seoTitle: `${name} — Shine Globe`,
    seoDesc: `${name} collection at Shine Globe.`, keywords: name, active: true, featured: false,
    created: new Date().toISOString().slice(0, 10)
  }));
  return {
    products,
    categories,
    orders: readJson(path.join(ROOT, 'assets', 'data', 'orders.json')),
    customers: readJson(path.join(ROOT, 'assets', 'data', 'customers.json')),
    settings: {}
  };
}
function getStore(){
  if(!fs.existsSync(STORE_FILE)){
    fs.mkdirSync(STORE_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(defaultStore(), null, 2));
    console.info('[store] Created data/store.json from the supplied seed files.');
  }
  return readJson(STORE_FILE);
}
function saveStore(store){
  fs.mkdirSync(STORE_DIR, { recursive: true });
  const temp = `${STORE_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(store, null, 2));
  fs.renameSync(temp, STORE_FILE);
}
function sendJson(res, status, body){
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, max-age=0', 'Pragma': 'no-cache' });
  res.end(JSON.stringify(body));
}
function notify(resource){
  const message = `event: update\ndata: ${JSON.stringify({ resource, updatedAt: new Date().toISOString() })}\n\n`;
  EVENT_CLIENTS.forEach(client => client.write(message));
  console.info(`[sync] ${resource} updated; notified ${EVENT_CLIENTS.size} connected client(s).`);
}
function readBody(req){
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if(body.length > 5e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
function contentType(file){
  return ({ '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png' })[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const apiMatch = url.pathname.match(/^\/api\/(products|categories|orders|customers|settings)$/);
  if(url.pathname === '/api/events'){
    res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', 'Connection':'keep-alive' });
    res.write('retry: 3000\n\n'); EVENT_CLIENTS.add(res);
    req.on('close', () => EVENT_CLIENTS.delete(res));
    return;
  }
  if(apiMatch){
    const resource = apiMatch[1];
    if(req.method === 'GET'){
      const store = getStore();
      console.info(`[api] GET /api/${resource} -> ${store[resource].length ?? 'object'} record(s)`);
      return sendJson(res, 200, store[resource]);
    }
    if(req.method === 'PUT'){
      try {
        const value = await readBody(req);
        if(resource !== 'settings' && !Array.isArray(value)) return sendJson(res, 400, { error: 'Expected an array.' });
        const store = getStore(); store[resource] = value; saveStore(store); notify(resource);
        console.info(`[api] PUT /api/${resource} persisted ${Array.isArray(value) ? value.length : 'settings'} record(s).`);
        return sendJson(res, 200, store[resource]);
      } catch(error){ return sendJson(res, 400, { error: error.message }); }
    }
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }
  const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const file = path.resolve(ROOT, `.${requested}`);
  if(!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return sendJson(res, 404, { error: 'Not found.' });
  res.writeHead(200, { 'Content-Type':contentType(file), 'Cache-Control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=300' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.info(`Shine Globe server running at http://localhost:${PORT}`));
