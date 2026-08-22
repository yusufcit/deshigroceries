#!/usr/bin/env node
/**
 * fix-category-images.mjs
 * --------------------
 * Sets a unique `image_url` on every category based on its slug so that
 * no two categories display the same image on the storefront.
 *
 * Uses the Supabase service-role key (bypasses RLS) via supabase-js.
 *
 * Usage:  npm run fix:category-images
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
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

/**
 * Maps each category slug to:
 *   emoji  – always rendered as a fallback (no network needed)
 *   image  – a category-relevant Unsplash Source URL
 */
const categoryData = {
  // Meat & Seafood
  "meats-seafood":            { emoji: "🦞", image: "https://source.unsplash.com/400x400/?seafood" },
  "frozen-sea-food":          { emoji: "🐟", image: "https://source.unsplash.com/400x400/?frozen-fish" },
  "frozen-meat-poultry":      { emoji: "🍗", image: "https://source.unsplash.com/400x400/?frozen-chicken" },
  "fresh-meat":               { emoji: "🥩", image: "https://source.unsplash.com/400x400/?fresh-meat" },
  "eggs":                     { emoji: "🥚", image: "https://source.unsplash.com/400x400/?eggs" },

  // Frozen
  "frozen-food":              { emoji: "❄️", image: "https://source.unsplash.com/400x400/?frozen-food" },
  "frozen-vegtables":         { emoji: "🥦", image: "https://source.unsplash.com/400x400/?frozen-vegetables" },

  // Dry Goods / Pantry
  "dry-fruits-and-nuts":      { emoji: "🥜", image: "https://source.unsplash.com/400x400/?nuts,dried-fruit" },
  "grains-millets":           { emoji: "🌾", image: "https://source.unsplash.com/400x400/?grains,millet" },
  "wheat-grains":             { emoji: "🌾", image: "https://source.unsplash.com/400x400/?wheat,grain" },
  "lentils":                  { emoji: "🟤", image: "https://source.unsplash.com/400x400/?lentils" },
  "rice":                     { emoji: "🍚", image: "https://source.unsplash.com/400x400/?rice" },
  "flours-atta":              { emoji: "🍞", image: "https://source.unsplash.com/400x400/?flour" },
  "oils":                     { emoji: "🫒", image: "https://source.unsplash.com/400x400/?cooking-oil" },
  "spices":                   { emoji: "🌶️", image: "https://source.unsplash.com/400x400/?spices" },
  "condiments-kitchen":       { emoji: "🧂", image: "https://source.unsplash.com/400x400/?condiments" },
  "sauces":                   { emoji: "🍯", image: "https://source.unsplash.com/400x400/?sauce" },
  "jams-spread":              { emoji: "🍓", image: "https://source.unsplash.com/400x400/?jam" },
  "powder-grains":            { emoji: "🫘", image: "https://source.unsplash.com/400x400/?spice-powder" },
  "canned-foods":             { emoji: "🥫", image: "https://source.unsplash.com/400x400/?canned-goods" },
  "precooked-canned-food":    { emoji: "🍲", image: "https://source.unsplash.com/400x400/?canned-food" },
  "ready-meals":              { emoji: "🍱", image: "https://source.unsplash.com/400x400/?ready-meal" },
  "snacks-crisps":            { emoji: "🍟", image: "https://source.unsplash.com/400x400/?snacks" },
  "bakery":                   { emoji: "🥐", image: "https://source.unsplash.com/400x400/?bakery" },
  "cereals":                  { emoji: "🥣", image: "https://source.unsplash.com/400x400/?cereal" },
  "tea-and-coffee":           { emoji: "☕", image: "https://source.unsplash.com/400x400/?tea" },
  "drinks-juice-beverage":    { emoji: "🥤", image: "https://source.unsplash.com/400x400/?juice" },
  "sweets-choclates":         { emoji: "🍭", image: "https://source.unsplash.com/400x400/?chocolate" },
  "confectionery":            { emoji: "🍫", image: "https://source.unsplash.com/400x400/?candy" },
  "grocery-staples":          { emoji: "🛒", image: "https://source.unsplash.com/400x400/?grocery" },

  // Dairy & Chilled
  "milk-cheese-youghurt":     { emoji: "🧀", image: "https://source.unsplash.com/400x400/?cheese" },
  "dairy-chilled-food":       { emoji: "🧊", image: "https://source.unsplash.com/400x400/?dairy" },

  // Produce
  "vegtables-fruits":         { emoji: "🥬", image: "https://source.unsplash.com/400x400/?vegetables" },

  // Beauty
  "cosmetic":                 { emoji: "💄", image: "https://source.unsplash.com/400x400/?cosmetics" },

  // Generic
  "general":                  { emoji: "🛍️", image: "https://source.unsplash.com/400x400/?grocery" },
};

// Fetch all active categories, then update each one.
const { data: categories, error: fetchError } = await supabase
  .from("categories")
  .select("id, name, slug");

if (fetchError) {
  console.error("❌ Failed to fetch categories:", fetchError.message);
  process.exit(1);
}

console.log(`Found ${categories.length} categories. Updating images...\n`);

let updated = 0;
let skipped = 0;

for (const cat of categories) {
  const info = categoryData[cat.slug];

  if (info) {
    const { error: updError } = await supabase
      .from("categories")
      .update({ image_url: info.image, updated_at: new Date().toISOString() })
      .eq("id", cat.id);

    if (updError) {
      console.log(`  ❌ ${cat.name} (${cat.slug}) — ERROR: ${updError.message}`);
    } else {
      console.log(`  ✅ ${cat.name} (${cat.slug}) — set image_url → ${info.image}`);
      updated++;
    }
  } else {
    console.log(`  ⚠️  ${cat.name} (${cat.slug}) — no mapping found, left unchanged`);
    skipped++;
  }
}

console.log(`\nDone! Updated ${updated} category image(s), skipped ${skipped}.`);
