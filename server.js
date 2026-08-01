require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { createClient } = require("@supabase/supabase-js");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(ROOT, "assets", "data");
const EVENT_CLIENTS = new Set();

let supabase = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.warn("[supabase] client init failed, falling back to local file storage.", error.message);
  }
}

const RESOURCE_FILES = {
  products: "products.json",
  categories: "categories.json",
  orders: "orders.json",
  customers: "customers.json",
  settings: "settings.json"
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function notify(resource) {
  const message = `event: update\ndata:${JSON.stringify({ resource, updatedAt: new Date().toISOString() })}\n\n`;
  EVENT_CLIENTS.forEach(client => client.write(message));
}

function contentType(file) {
  const map = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml"
  };
  return map[path.extname(file)] || "application/octet-stream";
}

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.warn(`[data] Could not parse ${filePath}`, error.message);
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  ensureDataDir();
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function buildCategoriesFromProducts(products) {
  const names = [...new Set((products || []).map(product => product.category).filter(Boolean))];
  return names.map((name, index) => ({
    id: index + 1,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    desc: `${name} collection at Shine Globe.`,
    icon: "fa-tag",
    color: "#2563EB",
    banner: "",
    seoTitle: `${name} — Shine Globe`,
    seoDesc: `${name} collection at Shine Globe.`,
    keywords: name,
    active: true,
    featured: false,
    created: new Date().toISOString().slice(0, 10)
  }));
}

function getSeedData() {
  const products = readJsonFile(path.join(DATA_DIR, "products.json"), []);
  const categories = readJsonFile(path.join(DATA_DIR, "categories.json"), buildCategoriesFromProducts(products));
  return {
    products,
    categories,
    orders: readJsonFile(path.join(DATA_DIR, "orders.json"), []),
    customers: readJsonFile(path.join(DATA_DIR, "customers.json"), []),
    settings: readJsonFile(path.join(DATA_DIR, "settings.json"), {
      storeName: "Shine Globe",
      currency: "INR",
      taxEnabled: true,
      inventoryTracking: true,
      shippingThreshold: 25000,
      freeShippingThreshold: 25000
    })
  };
}

function loadResource(resource) {
  const filePath = path.join(DATA_DIR, RESOURCE_FILES[resource] || `${resource}.json`);
  if (!fs.existsSync(filePath)) {
    const seed = getSeedData()[resource] ?? (resource === "categories" ? buildCategoriesFromProducts(getSeedData().products) : resource === "settings" ? {} : []);
    writeJsonFile(filePath, seed);
    return seed;
  }
  return readJsonFile(filePath, resource === "settings" ? {} : []);
}

function saveResource(resource, value) {
  const filePath = path.join(DATA_DIR, RESOURCE_FILES[resource] || `${resource}.json`);
  writeJsonFile(filePath, value);
  return value;
}

async function loadFromSupabase(resource) {
  if (!supabase) return null;
  const table = resource === "settings" ? "settings" : resource;

  try {
    const { data, error } = await supabase.from(table).select("*").order("id", { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) return null;

    if (resource === "settings") {
      const first = data[0];
      if (first && typeof first === "object") {
        if (first.data && typeof first.data === "object") return first.data;
        if (first.value && typeof first.value === "object") return first.value;
        if (first.settings && typeof first.settings === "object") return first.settings;
      }
      return data[0];
    }

    return data.map(row => row.data && typeof row.data === "object" ? row.data : row);
  } catch (error) {
    console.warn(`[supabase] could not load ${resource}`, error.message);
    return null;
  }
}

async function saveToSupabase(resource, value) {
  if (!supabase) return false;
  const table = resource === "settings" ? "settings" : resource;

  try {
    if (resource === "settings") {
      const { error } = await supabase.from(table).upsert({ id: 1, data: value }, { onConflict: "id" }).select();
      if (error) throw error;
      return true;
    }

    const rows = Array.isArray(value) ? value : [value];
    const normalized = rows.map(item => {
      if (!item || typeof item !== "object") return item;
      const copy = { ...item };
      if (copy.id === undefined || copy.id === null) delete copy.id;
      return copy;
    });

    const { error } = await supabase.from(table).upsert(normalized, { onConflict: "id" }).select();
    if (error) throw error;
    return true;
  } catch (error) {
    console.warn(`[supabase] could not save ${resource}`, error.message);
    return false;
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    res.write("retry:3000\n\n");
    EVENT_CLIENTS.add(res);
    req.on("close", () => EVENT_CLIENTS.delete(res));
    return;
  }

  const apiMatch = url.pathname.match(/^\/api\/(products|categories|orders|customers|settings|health)$/);
  if (apiMatch) {
    const resource = apiMatch[1];

    if (resource === "health") {
      return sendJson(res, 200, {
        ok: true,
        mode: supabase ? "supabase+local" : "local",
        availableResources: ["products", "categories", "orders", "customers", "settings"]
      });
    }

    if (req.method === "GET") {
      const localValue = loadResource(resource);
      const remoteValue = resource === "settings" ? await loadFromSupabase(resource) : await loadFromSupabase(resource);
      const value = remoteValue ?? localValue;
      if (value !== null && value !== undefined) {
        saveResource(resource, value);
      }
      return sendJson(res, 200, value);
    }

    if (req.method === "PUT") {
      try {
        const value = await readBody(req);

        if (resource === "settings") {
          if (value === null || typeof value !== "object" || Array.isArray(value)) {
            return sendJson(res, 400, { error: "Expected a settings object." });
          }
        } else if (!Array.isArray(value)) {
          return sendJson(res, 400, { error: "Expected an array." });
        }

        saveResource(resource, value);
        await saveToSupabase(resource, value);
        notify(resource);
        return sendJson(res, 200, value);
      } catch (error) {
        return sendJson(res, 500, { error: error.message });
      }
    }

    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.resolve(ROOT, `.${requested}`);

  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return sendJson(res, 404, { error: "Not Found" });
  }

  res.writeHead(200, {
    "Content-Type": contentType(filePath),
    "Cache-Control": filePath.endsWith(".html") ? "no-cache" : "public, max-age=300"
  });
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, async () => {
  console.log(`🚀 Shine Globe running on http://localhost:${PORT}`);
  const initialSeed = getSeedData();
  for (const resource of ["products", "categories", "orders", "customers", "settings"]) {
    const value = initialSeed[resource] ?? (resource === "categories" ? buildCategoriesFromProducts(initialSeed.products) : resource === "settings" ? {} : []);
    saveResource(resource, value);
    await saveToSupabase(resource, value);
  }
  console.log("✅ Local data files initialized and synced to Supabase when available.");
});