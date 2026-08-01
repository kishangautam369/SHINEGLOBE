require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { createClient } = require("@supabase/supabase-js");
const { formidable } = require("formidable");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(ROOT, "assets", "data");
const UPLOAD_DIR = path.join(ROOT, "assets", "images", "uploads");
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
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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

function normalizeCategoryForDb(category) {
  if (!category || typeof category !== "object") return category;
  return {
    id: category.id,
    name: category.name ?? "",
    slug: category.slug ?? "",
    description: category.desc ?? category.description ?? null,
    icon: category.icon ?? null,
    color: category.color ?? null,
    banner: category.banner ?? null,
    seo_title: category.seoTitle ?? null,
    seo_description: category.seoDesc ?? null,
    keywords: category.keywords ?? null,
    active: category.active !== false,
    featured: !!category.featured,
    created_at: category.created ?? new Date().toISOString().slice(0, 10)
  };
}

function normalizeCategoryFromDb(row) {
  if (!row || typeof row !== "object") return row;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    desc: row.description || row.desc || "",
    icon: row.icon || "fa-tag",
    color: row.color || "#2563EB",
    banner: row.banner || "",
    seoTitle: row.seo_title || row.seoTitle || "",
    seoDesc: row.seo_description || row.seoDesc || "",
    keywords: row.keywords || "",
    active: row.active !== false,
    featured: !!row.featured,
    created: row.created_at || row.created || new Date().toISOString().slice(0, 10)
  };
}

function normalizeSettingsForDb(settings) {
  const value = settings && typeof settings === "object" ? settings : {};
  return {
    id: 1,
    site_name: value.storeName || value.site_name || "Shine Globe",
    site_email: value.storeEmail || value.site_email || null,
    phone: value.phone || null,
    address: value.address || null,
    logo: value.logo || null,
    updated_at: new Date().toISOString()
  };
}

function normalizeProductForDb(product) {
  if (!product || typeof product !== "object") return product;
  return {
    id: product.id,
    name: product.name ?? "",
    category: product.category ?? "",
    brand: product.brand ?? "",
    price: Number(product.price ?? 0),
    rating: Number(product.rating ?? 4.5),
    reviews: Number(product.reviews ?? 0),
    stock: Number(product.stock ?? 0),
    badge: product.badge ?? "",
    image: product.image ?? "",
    desc: product.desc ?? "",
    oldPrice: product.oldPrice ?? null
  };
}

function normalizeProductFromDb(row) {
  if (!row || typeof row !== "object") return row;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    brand: row.brand,
    price: Number(row.price ?? 0),
    oldPrice: row.oldPrice ?? null,
    rating: Number(row.rating ?? 4.5),
    reviews: Number(row.reviews ?? 0),
    stock: Number(row.stock ?? 0),
    badge: row.badge || "",
    image: row.image || "",
    desc: row.desc || "",
    active: true
  };
}

function normalizeSettingsFromDb(row) {
  const base = {
    storeName: "Shine Globe",
    currency: "INR",
    taxEnabled: true,
    inventoryTracking: true,
    shippingThreshold: 25000,
    freeShippingThreshold: 25000
  };

  if (!row || typeof row !== "object") return base;

  return {
    ...base,
    storeName: row.site_name || row.storeName || base.storeName,
    storeEmail: row.site_email || row.storeEmail || null,
    phone: row.phone || null,
    address: row.address || null,
    logo: row.logo || null,
    currency: row.currency || base.currency,
    taxEnabled: typeof row.tax_enabled === "boolean" ? row.tax_enabled : (row.taxEnabled ?? base.taxEnabled),
    inventoryTracking: typeof row.inventory_tracking === "boolean" ? row.inventory_tracking : (row.inventoryTracking ?? base.inventoryTracking),
    shippingThreshold: row.shipping_threshold ?? row.shippingThreshold ?? base.shippingThreshold,
    freeShippingThreshold: row.free_shipping_threshold ?? row.freeShippingThreshold ?? base.freeShippingThreshold
  };
}

async function loadFromSupabase(resource) {
  if (!supabase) return null;

  try {
    if (resource === "categories") {
      const { data, error } = await supabase.from("categories").select("*").order("id", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data.map(normalizeCategoryFromDb);
    }

    if (resource === "settings") {
      const { data, error } = await supabase.from("settings").select("*").order("id", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return normalizeSettingsFromDb(data[0]);
    }

    if (resource === "products") {
      const { data, error } = await supabase.from("products").select("*").order("id", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data.map(normalizeProductFromDb);
    }

    const { data, error } = await supabase.from(resource).select("*").order("id", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return data.map(row => row.data && typeof row.data === "object" ? row.data : row);
  } catch (error) {
    console.warn(`[supabase] could not load ${resource}`, error.message);
    return null;
  }
}

async function saveToSupabase(resource, value) {
  if (!supabase) return false;

  try {
    if (resource === "settings") {
      const row = normalizeSettingsForDb(value);
      const { error } = await supabase.from("settings").upsert(row, { onConflict: "id" }).select();
      if (error) throw error;
      return true;
    }

    if (resource === "categories") {
      const rows = Array.isArray(value) ? value : [value];
      const normalized = rows.map(normalizeCategoryForDb);
      const { error } = await supabase.from("categories").upsert(normalized, { onConflict: "id" }).select();
      if (error) throw error;
      return true;
    }

    if (resource === "products") {
      const rows = Array.isArray(value) ? value : [value];
      const normalized = rows.map(normalizeProductForDb);
      const ids = normalized.filter(r => r.id !== undefined && r.id !== null).map(r => r.id);
      if (ids.length > 0) {
        const { error: deleteError } = await supabase.from("products").delete().not("id", "in", `(${ids.join(",")})`);
        if (deleteError) throw deleteError;
      } else {
        const { error: deleteError } = await supabase.from("products").delete().neq("id", 0);
        if (deleteError) throw deleteError;
      }
      const { error } = await supabase.from("products").upsert(normalized, { onConflict: "id" }).select();
      if (error) throw error;
      return true;
    }

    if (resource === "categories") {
      const rows = Array.isArray(value) ? value : [value];
      const normalized = rows.map(normalizeCategoryForDb);
      const ids = normalized.filter(r => r.id !== undefined && r.id !== null).map(r => r.id);
      if (ids.length > 0) {
        const { error: deleteError } = await supabase.from("categories").delete().not("id", "in", `(${ids.join(",")})`);
        if (deleteError) throw deleteError;
      } else {
        const { error: deleteError } = await supabase.from("categories").delete().neq("id", 0);
        if (deleteError) throw deleteError;
      }
      const { error } = await supabase.from("categories").upsert(normalized, { onConflict: "id" }).select();
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

    const { error } = await supabase.from(resource).upsert(normalized, { onConflict: "id" }).select();
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

  if (url.pathname === "/api/upload-image") {
    if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed." });

    ensureDataDir();
    const form = formidable({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
      filename: (_, originalName) => {
        const ext = path.extname(originalName || "image.jpg");
        return `img-${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`;
      }
    });

    form.parse(req, (error, fields, files) => {
      if (error) return sendJson(res, 500, { error: error.message });
      const file = files.image || files.file || files.upload;
      if (!file || !Array.isArray(file) && !file.filepath) {
        return sendJson(res, 400, { error: "No image file provided." });
      }
      const uploaded = Array.isArray(file) ? file[0] : file;
      const relativePath = `/assets/images/uploads/${path.basename(uploaded.filepath)}`;
      return sendJson(res, 200, { url: relativePath, name: uploaded.originalFilename || path.basename(uploaded.filepath) });
    });
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