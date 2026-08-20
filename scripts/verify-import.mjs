import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const env = {};
for (const line of readFileSync(resolve(new URL(".", import.meta.url).pathname, "../.env.local"), "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq <= 0) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}
const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "") + "/rest/v1";
const h = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Prefer": "count=exact" };

const prod = await fetch(base + "/products?select=id,name,slug,price,is_available&limit=3&order=name.asc", { headers: h });
console.log("sample products:", JSON.stringify(await prod.json(), null, 1));
const mult = await fetch(base + "/products?select=name,images&slug=eq.tyj-spring-roll-pastry-30-sheets", { headers: h });
console.log("multi-image:", JSON.stringify(await mult.json()));
for (const t of ["categories", "products", "delivery_zones", "site_settings", "admin_users", "orders"]) {
  const r = await fetch(base + `/${t}?select=id&limit=1`, { headers: h });
  console.log(`${t} count-range:`, r.headers.get("content-range"));
}
const dz = await fetch(base + "/delivery_zones?select=name,delivery_fee", { headers: h });
console.log("delivery_zones:", JSON.stringify(await dz.json()));
const ss = await fetch(base + "/site_settings?select=setting_key", { headers: h });
console.log("site_settings keys:", JSON.stringify((await ss.json()).map(x => x.setting_key)));
