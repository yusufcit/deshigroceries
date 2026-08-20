#!/usr/bin/env node
/**
 * import-umami-rest.mjs
 * ----------------------
 * Imports umami-foods-import.sql into Supabase via the PostgREST REST API
 * (because the /pg/v1/sql "SQL API" endpoint may be disabled on the project).
 *
 * What it does:
 *   1. Reads credentials from .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 *   2. Cleans the app-data tables (order_items, orders, addresses, customers,
 *      products, categories). PRESERVES admin_users, delivery_zones, site_settings.
 *   3. Parses umami-foods-import.sql into categories + products.
 *   4. Upserts categories (on slug), then products (on slug) in batches.
 *
 * Usage:
 *   node scripts/import-umami-rest.mjs [path-to-sql]
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------- tiny env loader ----------
function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnv(resolve(".env.local"));
const BASE = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "") + "/rest/v1";
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!env.NEXT_PUBLIC_SUPABASE_URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

// ---------- SQL parser ----------
function splitTopLevel(s, sep = ",") {
  const parts = [];
  let depth = 0, bracket = 0, cur = "", inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      cur += c;
      if (c === "'") {
        if (s[i + 1] === "'") { cur += s[i + 1]; i++; }
        else inStr = false;
      }
      continue;
    }
    if (c === "'") { inStr = true; cur += c; continue; }
    if (c === "(") { depth++; cur += c; continue; }
    if (c === ")") { depth--; cur += c; continue; }
    if (c === "[") { bracket++; cur += c; continue; }
    if (c === "]") { bracket--; cur += c; continue; }
    if (c === sep && depth === 0 && bracket === 0) { parts.push(cur); cur = ""; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim());
}

function unquote(str) {
  // strip surrounding single quotes and unescape ''
  if (str.length >= 2 && str[0] === "'" && str[str.length - 1] === "'") {
    return str.slice(1, -1).replace(/''/g, "'");
  }
  return str;
}

function parseField(f) {
  const v = f.trim();
  if (v === "NULL") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^\d+(\.\d+)?$/.test(v)) return Number(v);
  if (/^ARRAY\s*\[/.test(v)) {
    const inner = v.slice(v.indexOf("[") + 1, v.lastIndexOf("]"));
    if (!inner.trim()) return [];
    return splitTopLevel(inner).map(unquote);
  }
  if (v.startsWith("(") && /SELECT id FROM categories WHERE slug = '([^']+)'/.test(v)) {
    const m = v.match(/SELECT id FROM categories WHERE slug = '([^']+)'/);
    return { __categorySlug: m[1] };
  }
  if (v.startsWith("'")) return unquote(v);
  return v; // fallback (raw number, etc.)
}

function extractInsert(sql, table) {
  const re = new RegExp(`INSERT INTO ${table}[\\s\\S]*?VALUES\\s*([\\s\\S]*?)ON CONFLICT`, "i");
  const m = sql.match(re);
  if (!m) throw new Error(`Could not find INSERT INTO ${table}`);
  const valuesBody = m[1].replace(/;\s*$/, "").trim();
  return splitTopLevel(valuesBody).map((tuple) => {
    const inner = tuple.slice(tuple.indexOf("(") + 1, tuple.lastIndexOf(")"));
    return splitTopLevel(inner).map(parseField);
  });
}

const SQL_FILE = process.argv[2] || "umami-foods-import.sql";
const sql = readFileSync(resolve(SQL_FILE), "utf-8");
const categories = extractInsert(sql, "categories");
const products = extractInsert(sql, "products");
console.log(`Parsed ${categories.length} categories and ${products.length} products from ${SQL_FILE}`);

// ---------- REST helpers ----------
async function rest(method, path, body, prefer) {
  const headers = { ...H };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok && res.status !== 206) {
    throw new Error(`REST ${method} ${path} -> HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return { status: res.status, body: text ? JSON.parse(text) : null, range: res.headers.get("content-range") };
}

async function cleanTables() {
  // Preserve admin_users, delivery_zones, site_settings (store config/admin access)
  const order = [
    "order_items",
    "orders",
    "addresses",
    "customers",
    "products",
    "categories",
  ];
  for (const t of order) {
    const { range } = await rest(
      "DELETE",
      `/${t}?id=neq.00000000-0000-0000-0000-000000000000`,
      null,
      "return=minimal"
    );
    console.log(`  cleaned ${t} (deleted ${(range || "").split("/")[1] ?? "?"} rows)`);
  }
}

async function upsertCategories() {
  const rows = categories.map(([name, slug, description, display_order]) => ({
    name,
    slug,
    description,
    display_order,
  }));
  const { body } = await rest("POST", "/categories", rows, "resolution=merge-duplicates,return=representation");
  const got = Array.isArray(body) ? body : [];
  const map = {};
  for (const c of got) map[c.slug] = c.id;
  if (Object.keys(map).length < rows.length) {
    const list = await rest("GET", "/categories?select=id,slug&limit=1000");
    for (const c of list.body) map[c.slug] = c.id;
  }
  console.log(`  upserted ${rows.length} categories`);
  return map;
}

async function upsertProducts(slugToId) {
  const mapped = products.map((row) => {
    const [
      catExpr, name, slug, description, price, compare_at_price,
      image_url, images, stock_quantity, is_available, is_featured,
      seo_title, seo_description,
    ] = row;
    return {
      category_id: slugToId[catExpr.__categorySlug] ?? null,
      name,
      slug,
      description,
      price,
      compare_at_price,
      image_url,
      images,
      stock_quantity,
      is_available,
      is_featured,
      seo_title,
      seo_description,
    };
  });

  const BATCH = 200;
  let inserted = 0;
  for (let i = 0; i < mapped.length; i += BATCH) {
    const chunk = mapped.slice(i, i + BATCH);
    await rest("POST", "/products", chunk, "resolution=merge-duplicates,return=minimal");
    inserted += chunk.length;
    console.log(`  products... ${inserted}/${mapped.length}`);
  }
}

async function counts() {
  for (const t of ["categories", "products"]) {
    const { range } = await rest("GET", `/${t}?select=id&limit=1`, null, "count=exact");
    console.log(`  ${t} total = ${(range || "").split("/")[1] ?? "?"}`);
  }
}

// ---------- main ----------
console.log("Step 1: cleaning app-data tables (keeping admin_users / delivery_zones / site_settings)...");
await cleanTables();

console.log("Step 2: importing categories...");
const slugToId = await upsertCategories();

console.log("Step 3: importing products...");
await upsertProducts(slugToId);

console.log("Step 4: verifying...");
await counts();
console.log("Done ✅");