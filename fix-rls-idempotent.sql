-- ================================================================
-- Deshi Grocery – RLS Policy Repair (IDEMPOTENT)
-- Fixes: "infinite recursion detected in policy for relation admin_users"
-- which makes ALL public reads of categories/products fail (HTTP 500).
--
-- Safe to paste & re-run any number of times:
--   * every DROP uses IF EXISTS
--   * policies are dropped BEFORE being recreated (no "already exists")
-- ================================================================

-- ---------- 1) Drop every policy on the affected tables ----------
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Public can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Service role can manage categories" ON categories;

DROP POLICY IF EXISTS "Anyone can view available products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Service role can manage products" ON products;

DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Authenticated can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;

-- ---------- 2) admin_users: authenticated can read (no recursion) ----------
-- NOTE: must NOT reference admin_users inside its own USING clause.
CREATE POLICY "Authenticated can view admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- ---------- 3) categories: public read + service-role write + admin write ----------
CREATE POLICY "Anyone can view active categories"
  ON categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage categories"
  ON categories
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Reference to admin_users is safe now (no recursion on admin_users itself).
CREATE POLICY "Admins can manage categories"
  ON categories
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true));

-- ---------- 4) products: public read + service-role write + admin write ----------
CREATE POLICY "Anyone can view available products"
  ON products
  FOR SELECT
  USING (is_available = true);

CREATE POLICY "Service role can manage products"
  ON products
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true));

-- ---------- 5) Verify ----------
SELECT 'categories (is_active)' AS check_name, COUNT(*) AS count FROM categories WHERE is_active = true
UNION ALL
SELECT 'products (is_available)', COUNT(*) FROM products WHERE is_available = true;