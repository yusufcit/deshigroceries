#!/usr/bin/env python3
"""
fetch_umami_products.py
-----------------------
Pulls ALL products from the public WooCommerce Store API of
https://www.umamifoods.ie/ and generates a SQL import file for the
Next.js + Supabase "deshigroceries" app.

Outputs (in the current working directory):
  umami-products-raw.json  - full raw product payloads (reproducibility)
  umami-products.sql       - SQL to seed `categories` and `products`

Prices from the WooCommerce Store API are in euro-cents (e.g. "399" = EUR 3.99),
so they are divided by 100 for the DECIMAL price columns.
"""

import csv
import html
import json
import re
import sys
import time
import urllib.request

BASE_URL = "https://www.umamifoods.ie/wp-json/wc/store/products"
PER_PAGE = 100

OUT_JSON = "umami-products-raw.json"
OUT_SQL = "umami-products.sql"
OUT_CSV = "umami-products.csv"


def http_get(url: str) -> tuple:
    """Return (status, body_bytes, headers_dict)."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (deshigrocery-product-importer)",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read()
        headers = {k: v for k, v in resp.headers.items()}
        return resp.status, body, headers


def strip_html(raw) -> str:
    """Strip tags and decode HTML entities."""
    if not raw:
        return ""
    text = html.unescape(re.sub(r"<[^>]+>", " ", str(raw)))
    text = text.replace("\u00a0", " ")
    return re.sub(r"\s+", " ", text).strip()


def slugify(name: str) -> str:
    s = html.unescape(name).lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "uncategorised"


def main() -> None:
    # 1. Fetch all pages of products.
    url0 = f"{BASE_URL}?per_page={PER_PAGE}&page=1"
    status0, body0, head0 = http_get(url0)
    if status0 != 200:
        print(f"ERROR: HTTP {status0} fetching {url0}", file=sys.stderr)
        sys.exit(1)
    total = int(head0.get("x-wp-total", "0"))
    pages = int(head0.get("x-wp-totalpages", "1"))
    print(f"Fetching {total} products across {pages} page(s)...")

    all_products = []
    for page in range(1, pages + 1):
        url = f"{BASE_URL}?per_page={PER_PAGE}&page={page}"
        status, body, headers = http_get(url)
        if status != 200:
            print(f"WARN: HTTP {status} on page {page}, retrying once...", file=sys.stderr)
            time.sleep(2)
            status, body, headers = http_get(url)
            if status != 200:
                print(f"SKIP page {page} (HTTP {status})", file=sys.stderr)
                continue
        products = json.loads(body.decode("utf-8"))
        all_products.extend(products)
        print(f"  page {page}/{pages}: {len(products)} (cumulative {len(all_products)})")

    print(f"Total fetched: {len(all_products)}")
    with open(OUT_JSON, "w", encoding="utf-8") as fh:
        json.dump(all_products, fh, ensure_ascii=False, indent=2)

    # 2. Normalise categories + products.
    categories = {}
    products = {}
    skipped = 0

    for p in all_products:
        name = (strip_html(p.get("short_description")) or (p.get("name") or "").strip()).strip()
        if not name:
            skipped += 1
            continue

        cats = p.get("categories") or []
        cat_name = strip_html(cats[0].get("name")) if cats else "Uncategorised"
        cat_name = cat_name or "Uncategorised"
        cat_slug = slugify(cat_name)
        if cat_slug not in categories:
            categories[cat_slug] = {
                "name": cat_name,
                "slug": cat_slug,
                "sort_order": len(categories) + 1,
            }

        prices = p.get("prices") or {}
        price = to_decimal(prices.get("price"))
        regular = to_decimal(prices.get("regular_price"))
        if price is None or price <= 0:
            skipped += 1
            continue

        compare = None
        if regular is not None and price != regular:
            compare = regular

        images = p.get("images") or []
        image_url = images[0].get("src") if images else None
        all_images = [img.get("src") for img in images if img.get("src")]

        slug = slugify(name)
        if slug in products:
            products[slug]["name"] = products[slug]["name"]  # keep first occurrence
        else:
            products[slug] = {
                "name": name,
                "slug": slug,
                "description": clean_description(
                    p.get("description") or p.get("short_description") or "", name
                ),
                "price": f"{price:.2f}",
                "compare_at_price": f"{compare:.2f}" if compare is not None else None,
                "image_url": image_url,
                "images": all_images,
                "is_in_stock": bool(p.get("is_in_stock", True)),
                "category_slug": cat_slug,
            }

    print(f"Normalised: {len(products)} products, {len(categories)} categories, skipped {skipped}")
# 3. Write SQL seed file.
    with open(OUT_SQL, "w", encoding="utf-8") as fh:
        fh.write("-- ================================================================\n")
        fh.write("-- Umami Foods Ireland -> Deshi Grocery (Next.js / Supabase) Import\n")
        fh.write("-- Source: https://www.umamifoods.ie  (fetched via WooCommerce Store API)\n")
        fh.write("--\n")
        fh.write("-- Usage:\n")
        fh.write("--   1) Make sure supabase-schema.sql has been run once.\n")
        fh.write("--   2) Open Supabase -> SQL Editor, paste this file, and Run.\n")
        fh.write("-- Categories use ON CONFLICT (slug) so re-runs are safe.\n")
        fh.write("-- ================================================================\n\n")

        fh.write("-- 1. CATEGORIES --------------------------------------------------\n")
        fh.write("INSERT INTO categories (name, slug, description, display_order)\nVALUES\n")
        cat_rows = []
        for cat in categories.values():
            cat_rows.append(
                "("
                + esc(cat["name"]) + ", "
                + esc(cat["slug"]) + ", "
                + esc("Products imported from Umami Foods (Dublin).") + ", "
                + str(cat["sort_order"]) + ")"
            )
        fh.write(",\n".join(cat_rows))
        fh.write("\nON CONFLICT (slug) DO NOTHING;\n\n")

        fh.write("-- 2. PRODUCTS ----------------------------------------------------\n")
        fh.write("INSERT INTO products\n")
        fh.write("  (category_id, name, slug, description, price, compare_at_price,\n")
        fh.write("   image_url, images, stock_quantity, is_available, is_featured,\n")
        fh.write("   seo_title, seo_description)\nVALUES\n")
        prod_rows = []
        for prod in products.values():
            stock = 50 if prod["is_in_stock"] else 0
            images_sql = (
                "ARRAY[" + ", ".join(esc(i) for i in prod["images"]) + "]"
                if prod["images"]
                else "NULL"
            )
            compare = prod["compare_at_price"] if prod["compare_at_price"] is not None else "NULL"
            img = "NULL" if prod["image_url"] is None else esc(prod["image_url"])
            cat_sel = "(SELECT id FROM categories WHERE slug = " + esc(prod["category_slug"]) + ")"
            prod_rows.append(
                "("
                + cat_sel + ", "
                + esc(prod["name"]) + ", "
                + esc(prod["slug"]) + ", "
                + esc(prod["description"]) + ", "
                + prod["price"] + ", "
                + compare + ", "
                + img + ", "
                + images_sql + ", "
                + str(stock) + ", "
                + "true, "      # is_available
                + "false, "     # is_featured
                + esc(prod["name"]) + ", "   # seo_title
                + esc(prod["name"])           # seo_description
                + ")"
            )
        fh.write(",\n".join(prod_rows))
        fh.write("\nON CONFLICT (slug) DO NOTHING;\n\n")

        fh.write("-- Verify with:\n")
        fh.write("--   SELECT c.name AS category, p.name, p.price, p.is_available\n")
        fh.write("--   FROM products p JOIN categories c ON c.id = p.category_id\n")
        fh.write("--   ORDER BY c.display_order, p.name;\n")

    # 4. Export a CSV copy for spreadsheets / manual review.
    with open(OUT_CSV, "w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(
            ["Product Name", "Slug", "Category", "Price (EUR)",
             "Compare-At Price (EUR)", "In Stock", "Image URL", "Description"]
        )
        for prod in products.values():
            writer.writerow(
                [
                    prod["name"], prod["slug"], prod["category_slug"],
                    prod["price"], prod["compare_at_price"] or "",
                    "yes" if prod["is_in_stock"] else "no",
                    prod["image_url"] or "", prod["description"],
                ]
            )

    print(f"Wrote {OUT_SQL} ({len(categories)} categories, {len(products)} products) and {OUT_CSV}.")


def esc(value) -> str:
    """Escape a Python value for a single-quoted SQL string literal."""
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def to_decimal(minor_units):
    """Convert WooCommerce minor-unit price to EUR decimal string."""
    if minor_units in (None, ""):
        return None
    try:
        raw = float(minor_units)
    except (TypeError, ValueError):
        return None
    return round(raw / 100.0, 2)


def clean_description(desc_html, fallback):
    """Extract the first useful <p> paragraph as the description."""
    def is_noise(txt):
        low = txt.lower()
        return any(w in low for w in ("wishlist", "add to cart", "add to wishlist"))
    matches = re.findall(r"<p[^>]*>(.*?)</p>", desc_html or "", flags=re.S | re.I)
    for m in matches:
        txt = strip_html(m)
        if txt and len(txt) > 3 and not is_noise(txt):
            return txt
    txt = strip_html(desc_html)
    if len(txt) > 3 and not is_noise(txt) and txt.lower() != fallback.lower():
        return txt
    return fallback


if __name__ == "__main__":
    main()