# Umami Foods → Deshi Grocery Import (Next.js + Supabase)

This folder contains everything needed to import the full product catalogue and
prices from **[https://www.umamifoods.ie/](https://www.umamifoods.ie/)** into the
Deshi Grocery Next.js + Supabase app.

## Files

| File | Purpose |
|------|---------|
| **`umami-foods-import.sql`** | Ready-to-run SQL: inserts all categories + products. This is the main deliverable. |
| `scripts/fetch_umami_products.py` | Python 3 importer that fetches all products from the public WooCommerce Store API and regenerates the SQL/CSV/JSON. |
| `scripts/umami-products.sql` | Same content as `umami-foods-import.sql` (generated copy). |
| `scripts/umami-products.csv` | Flat CSV (Product Name, Slug, Category, Price, Compare-At, In Stock, Image URL, Description) – useful for spreadsheets/manual review. |
| `scripts/umami-products-raw.json` | Full untouched API payloads for reproducibility. |
| `scripts/validate_sql.py` | Structural sanity-checker for the generated SQL. |

## What was imported

- **1,524 unique products** (from 1,537 returned by the API; the rest were duplicate
  slug variants or had no usable price) across **35 product categories**.
- Prices converted from euro-cents (WooCommerce returns `"399"` → `€3.99`).
- `compare_at_price` set when the Umami product has a discount.
- Category names decoded from HTML entities (`Meats &amp; Seafood` → `Meats & Seafood`),
  wishlist/button boilerplate stripped from descriptions.
- Image URL(s) mapped to `image_url` + `images` (TEXT[] array).

## How to use

### 1. Run the schema (do this at least once)
Paste the whole `supabase-schema.sql` into the SQL Editor and run it. If you see
"relation categories already exists", **don't worry — that's expected**. This
file is now **idempotent**: it won't fail or duplicate anything, it only ensures
all tables and policies exist.

> **Prefer a one-command runner?** The project root already contains
> `scripts/run-supabase-sql.mjs` (uses `@supabase/supabase-js` credentials from
> `.env.local`). From the project root you can run:
> ```bash
> npm run import:schema   # runs supabase-schema.sql
> npm run import:umami    # runs umami-foods-import.sql
> ```
> This hits Supabase's SQL-over-HTTP endpoint with the service key and prints
> the result / any Postgres error.

### 2. Import the products
1. Open your Supabase project → **SQL Editor**.
2. Paste the entire contents of `umami-foods-import.sql` and click **Run**.
3. It is safe to re-run: categories use `ON CONFLICT (slug) DO NOTHING` and the
   products use `ON CONFLICT (slug) DO NOTHING` too, so running it again won't
   error or create duplicates.

> ⚠️ **SQL Editor unavailable (HTTP 404 `requested path is invalid`)?**
> Your Supabase project has the **SQL API (pg-meta) disabled**, so the
> `npm run import:umami` script cannot run SQL directly. Use the
> **PostgREST-based importer** instead (no dashboard changes needed):
> ```bash
> npm run import:umami:rest   # cleans app-data tables, then imports 35 categories + 1,524 products
> npm run import:verify       # shows row counts + a few sample rows
> ```
> `scripts/import-umami-rest.mjs` parses `umami-foods-import.sql` and upserts
> via the REST API with the service role key. It deletes rows from
> `order_items`, `orders`, `addresses`, `customers`, `products`, `categories`
> (re-importing categories + products), while **preserving** `admin_users`,
> `delivery_zones`, and `site_settings`.

### ⛔ Products imported but NOT visible in the storefront?
The most likely cause is a **recursive RLS policy**. The anon queries for
categories/products surface this error:
`infinite recursion detected in policy for relation "admin_users"`
(admin policies like `Admins can manage categories` read `admin_users` inside
their own policy).

**Fix — paste the idempotent script** (`fix-rls-idempotent.sql`):

1. Open Supabase → **SQL Editor**.
2. Paste the **entire** contents of **`fix-rls-idempotent.sql`**.
3. Click **Run** — it's safe to re-run as many times as you want (every policy is
   dropped first, then recreated).
4. Reload `/shop` → the 1,524 products and 35 categories appear.

> ⚠️ If you paste the **older** `fix-rls-policies.sql` instead, it may fail with
> `policy "Public can view categories" already exists` (it is not idempotent).
> Use `fix-rls-idempotent.sql` — it drops every policy (old, new, recursive)
> before recreating, so it always succeeds.
> Do **not** re-run `supabase-schema.sql` for this: it recreates the recursive
> policies.

### 3. Verify
Run this query in the SQL Editor:

```sql
SELECT c.name AS category, p.name, p.price, p.compare_at_price, p.is_available
FROM products p
JOIN categories c ON c.id = p.category_id
ORDER BY c.display_order, p.name
LIMIT 50;
```

## How to regenerate
Re-run the fetch whenever Umami updates their catalogue:

```bash
cd scripts
python3 fetch_umami_products.py
```
then copy the fresh SQL to the project root:
```bash
cp scripts/umami-products.sql umami-foods-import.sql
```