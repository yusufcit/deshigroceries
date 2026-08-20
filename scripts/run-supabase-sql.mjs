#!/usr/bin/env node
/**
 * run-supabase-sql.mjs
 * --------------------
 * Runs a SQL file against your Supabase project using the Supabase
 * service-role key (bypasses RLS) and the SQL-over-HTTP (pg-meta / PostgREST)
 * query endpoint.
 *
 * Usage:
 *   npm run import:schema   -> runs supabase-schema.sql
 *   npm run import:umami    -> runs umami-foods-import.sql
 *
 * It reads credentials from .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL          e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY         the service_role secret
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  const env = {};
  const text = readFileSync(path, "utf-8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    env[key] = val;
  }
  return env;
}

const env = loadEnv(resolve(".env.local"));
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const FILE = process.argv[2] || "supabase-schema.sql";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const url = new URL(SUPABASE_URL);
const endpoint = `${url.origin}/pg/v1/sql`;

// Supabase requires the anon key or service key in the apikey / Authorization
// headers (same value). For hosting DB queries the `apikey` header suffices.
const sql = readFileSync(resolve(FILE), "utf-8");

console.log(`Running ${FILE} (${sql.length.toLocaleString()} chars)...`);
const started = Date.now();

const res = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  },
  body: JSON.stringify({ query: sql }),
});

const text = await res.text();
const ms = Date.now() - started;

if (!res.ok) {
  console.error(`\nERROR (HTTP ${res.status}) after ${ms}ms:\n`);
  // Try to surface the Postgres error detail.
  try {
    const j = JSON.parse(text);
    console.error(j.message || j.details || text);
  } catch {
    console.error(text);
  }
  process.exit(1);
}
try {
  const j = JSON.parse(text);
  console.log("Result count(s):", JSON.stringify(j, null, 2).slice(0, 600));
} catch {
  console.log(text.slice(0, 600));
}