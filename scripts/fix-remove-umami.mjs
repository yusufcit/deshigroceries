#!/usr/bin/env node
/**
 * One-off: remove any "Umami" reference stored in the live Supabase DB.
 * Uses the service-role key (bypasses RLS) via supabase-js REST.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

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

const env = loadEnv(".env.local");
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const filter = (table) =>
  table === "products"
    ? "description.ilike.%umami%,name.ilike.%umami%,seo_description.ilike.%umami%"
    : "description.ilike.%umami%,name.ilike.%umami%";

for (const table of ["categories", "products"]) {
  const { data, error } = await supabase
    .from(table)
    .update({ description: null, updated_at: new Date().toISOString() })
    .or(filter(table))
    .select("id, name");
  if (error) {
    console.log(`[${table}] ERROR:`, error.message);
  } else {
    console.log(`[${table}] cleared ${data?.length ?? 0} row(s):`, (data || []).map((r) => r.name));
  }
}

// Verify nothing referencing "umami" remains anywhere queryable.
const checks = [
  ["categories", "description"],
  ["categories", "name"],
  ["products", "description"],
  ["products", "name"],
  ["products", "seo_description"],
];
for (const [table, col] of checks) {
  const { data, error } = await supabase.from(table).select("id").ilike(col, "%umami%");
  if (error) {
    console.log(`[verify ${table}.${col}] ERROR:`, error.message);
  } else {
    console.log(`[verify ${table}.${col}] rows remaining = ${data?.length ?? 0}`);
  }
}