-- Fix RLS Policies - Remove Infinite Recursion
-- Run this in Supabase SQL Editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view available products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;

-- Recreate categories policies (simpler - allow public read, admin write)
CREATE POLICY "Public can view categories" ON categories 
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Service role can manage categories" ON categories 
    FOR ALL 
    USING (auth.jwt()->>'role' = 'service_role');

-- Recreate products policies (simpler - allow public read, admin write)  
CREATE POLICY "Public can view products" ON products 
    FOR SELECT 
    USING (is_available = true);

CREATE POLICY "Service role can manage products" ON products 
    FOR ALL 
    USING (auth.jwt()->>'role' = 'service_role');

-- Fix admin_users policy (no recursion)
CREATE POLICY "Authenticated can view admin users" ON admin_users 
    FOR SELECT 
    TO authenticated
    USING (true);

-- Verify the fix
SELECT 'Categories count:' as check_name, COUNT(*) as count FROM categories WHERE is_active = true
UNION ALL
SELECT 'Products count:' as check_name, COUNT(*) as count FROM products WHERE is_available = true;
