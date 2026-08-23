-- Admin read access to customer records & addresses
-- (mirrors the existing "Admins can view all orders" policy pattern)
-- Idempotent: safe to re-run.

DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
CREATE POLICY "Admins can view all customers" ON customers FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);

DROP POLICY IF EXISTS "Admins can view all addresses" ON addresses;
CREATE POLICY "Admins can view all addresses" ON addresses FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);
