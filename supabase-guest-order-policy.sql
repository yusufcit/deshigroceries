-- ============================================================
-- Guest order visibility for the confirmation page.
-- Idempotent — safe to run more than once.
-- Run in Supabase Studio → SQL Editor (or npm run sql -- <file>).
-- ============================================================

DROP POLICY IF EXISTS "Guests can view their own guest orders" ON orders;
CREATE POLICY "Guests can view their own guest orders" ON orders FOR SELECT USING (
    auth.uid() IS NULL AND customer_id IS NULL
);

DROP POLICY IF EXISTS "Guests can view items of guest orders" ON order_items;
CREATE POLICY "Guests can view items of guest orders" ON order_items FOR SELECT USING (
    auth.uid() IS NULL
    AND order_id IN (SELECT id FROM orders WHERE customer_id IS NULL)
);
