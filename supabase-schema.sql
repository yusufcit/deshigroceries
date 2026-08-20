-- Deshi Grocery Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    image_url TEXT,
    images TEXT[], -- Array of image URLs
    weight_options JSONB, -- e.g., [{"value": "500g", "price": 10.99}, {"value": "1kg", "price": 19.99}]
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    seo_title VARCHAR(200),
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL DEFAULT 'Dublin',
    county VARCHAR(100) DEFAULT 'Dublin',
    eircode VARCHAR(10),
    delivery_instructions TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    
    -- Delivery address (denormalized for order history)
    delivery_address_line1 VARCHAR(255) NOT NULL,
    delivery_address_line2 VARCHAR(255),
    delivery_city VARCHAR(100) NOT NULL,
    delivery_county VARCHAR(100),
    delivery_eircode VARCHAR(10),
    delivery_instructions TEXT,
    
    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    payment_intent_id VARCHAR(255),
    stripe_session_id VARCHAR(255),
    
    -- Order status
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, out_for_delivery, delivered, cancelled
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    product_image_url TEXT,
    weight_option VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery zones table
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    eircode_prefixes TEXT[], -- e.g., ['D01', 'D02', 'D03']
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    minimum_order DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers (idempotent: drop-then-create)
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories (idempotent)
INSERT INTO categories (name, slug, description, display_order) VALUES
('Chicken', 'chicken', 'Fresh halal chicken products', 1),
('Lamb', 'lamb', 'Premium halal lamb cuts', 2),
('Beef', 'beef', 'Quality halal beef products', 3),
('Fish', 'fish', 'Fresh fish and seafood', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert default delivery zone for Dublin (idempotent: only if missing)
INSERT INTO delivery_zones (name, eircode_prefixes, delivery_fee, minimum_order)
SELECT 'Dublin City', ARRAY['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08'], 4.99, 20.00
WHERE NOT EXISTS (SELECT 1 FROM delivery_zones WHERE name = 'Dublin City');

INSERT INTO delivery_zones (name, eircode_prefixes, delivery_fee, minimum_order)
SELECT 'Dublin Suburbs', ARRAY['D09', 'D10', 'D11', 'D12', 'D13', 'D14', 'D15', 'D16', 'D17', 'D18', 'D20', 'D22', 'D24'], 6.99, 25.00
WHERE NOT EXISTS (SELECT 1 FROM delivery_zones WHERE name = 'Dublin Suburbs');

-- Insert default site settings (idempotent)
INSERT INTO site_settings (setting_key, setting_value) VALUES
('general', '{"site_name": "Deshi Grocery", "tagline": "Fresh Halal Meat & Fish Delivery in Dublin", "contact_email": "info@deshigrocery.ie", "contact_phone": "+353 1 234 5678"}'),
('delivery', '{"default_fee": 4.99, "free_delivery_threshold": 50.00, "minimum_order": 20.00}'),
('business_hours', '{"monday": "9:00-18:00", "tuesday": "9:00-18:00", "wednesday": "9:00-18:00", "thursday": "9:00-18:00", "friday": "9:00-20:00", "saturday": "9:00-18:00", "sunday": "10:00-16:00"}')
ON CONFLICT (setting_key) DO NOTHING;

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Categories: Public read, admin write
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);

-- Products: Public read, admin write
DROP POLICY IF EXISTS "Anyone can view available products" ON products;
CREATE POLICY "Anyone can view available products" ON products FOR SELECT USING (is_available = true);
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);

-- Customers: Users can manage their own data
DROP POLICY IF EXISTS "Users can view own data" ON customers;
CREATE POLICY "Users can view own data" ON customers FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own data" ON customers;
CREATE POLICY "Users can update own data" ON customers FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Anyone can insert customer" ON customers;
CREATE POLICY "Anyone can insert customer" ON customers FOR INSERT WITH CHECK (true);

-- Addresses: Users can manage their own addresses
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
CREATE POLICY "Users can view own addresses" ON addresses FOR SELECT USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
CREATE POLICY "Users can insert own addresses" ON addresses FOR INSERT WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
CREATE POLICY "Users can update own addresses" ON addresses FOR UPDATE USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
CREATE POLICY "Users can delete own addresses" ON addresses FOR DELETE USING (auth.uid() = customer_id);

-- Orders: Users can view their own, admins can view all
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);

-- Order items: Follow order policies
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
CREATE POLICY "Anyone can insert order items" ON order_items FOR INSERT WITH CHECK (true);

-- Delivery zones: Public read, admin write
DROP POLICY IF EXISTS "Anyone can view active delivery zones" ON delivery_zones;
CREATE POLICY "Anyone can view active delivery zones" ON delivery_zones FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage delivery zones" ON delivery_zones;
CREATE POLICY "Admins can manage delivery zones" ON delivery_zones FOR ALL USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);

-- Site settings: Public read, admin write
DROP POLICY IF EXISTS "Anyone can view settings" ON site_settings;
CREATE POLICY "Anyone can view settings" ON site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage settings" ON site_settings;
CREATE POLICY "Admins can manage settings" ON site_settings FOR ALL USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);

-- Admin users: Only admins can view
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
CREATE POLICY "Admins can view admin users" ON admin_users FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);
