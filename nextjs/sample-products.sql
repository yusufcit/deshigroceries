-- Sample Products for Deshi Grocery
-- Run this in Supabase SQL Editor after running supabase-schema.sql

-- Get category IDs (we'll use them in the INSERT statements)
-- Run this first to see your category IDs, then use them below

-- Insert sample products
INSERT INTO products (category_id, name, slug, description, price, compare_at_price, stock_quantity, is_available, is_featured) VALUES

-- Chicken Products
((SELECT id FROM categories WHERE slug = 'chicken'), 'Fresh Chicken Breast', 'fresh-chicken-breast', 'Premium halal chicken breast, boneless and skinless. Perfect for grilling or stir-fry.', 12.99, 14.99, 50, true, true),
((SELECT id FROM categories WHERE slug = 'chicken'), 'Chicken Thighs', 'chicken-thighs', 'Juicy halal chicken thighs, bone-in. Great for curries and roasting.', 9.99, null, 40, true, true),
((SELECT id FROM categories WHERE slug = 'chicken'), 'Whole Chicken', 'whole-chicken', 'Fresh whole halal chicken, approximately 1.5-2kg. Perfect for roasting.', 15.99, 18.99, 25, true, false),
((SELECT id FROM categories WHERE slug = 'chicken'), 'Chicken Wings', 'chicken-wings', 'Halal chicken wings. Perfect for BBQ or buffalo wings.', 8.99, null, 35, true, false),
((SELECT id FROM categories WHERE slug = 'chicken'), 'Chicken Mince', 'chicken-mince', 'Fresh halal chicken mince. Ideal for koftas, meatballs, and kebabs.', 7.99, null, 30, true, true),

-- Lamb Products
((SELECT id FROM categories WHERE slug = 'lamb'), 'Lamb Chops', 'lamb-chops', 'Premium halal lamb chops. Tender and flavorful, perfect for grilling.', 18.99, 21.99, 30, true, true),
((SELECT id FROM categories WHERE slug = 'lamb'), 'Lamb Leg', 'lamb-leg', 'Halal lamb leg, boneless. Excellent for roasting or slow cooking.', 24.99, 27.99, 15, true, true),
((SELECT id FROM categories WHERE slug = 'lamb'), 'Lamb Shoulder', 'lamb-shoulder', 'Halal lamb shoulder, bone-in. Perfect for curries and stews.', 16.99, null, 20, true, false),
((SELECT id FROM categories WHERE slug = 'lamb'), 'Lamb Mince', 'lamb-mince', 'Fresh halal lamb mince. Great for kebabs, koftas, and shepherds pie.', 11.99, null, 35, true, true),
((SELECT id FROM categories WHERE slug = 'lamb'), 'Lamb Shanks', 'lamb-shanks', 'Halal lamb shanks. Perfect for slow roasting or braising.', 14.99, null, 18, true, false),

-- Beef Products
((SELECT id FROM categories WHERE slug = 'beef'), 'Beef Steak', 'beef-steak', 'Premium halal beef sirloin steak. Tender and juicy, perfect for grilling.', 16.99, 19.99, 40, true, true),
((SELECT id FROM categories WHERE slug = 'beef'), 'Beef Mince', 'beef-mince', 'Fresh halal beef mince. Perfect for burgers, bolognese, and keema.', 9.99, null, 45, true, true),
((SELECT id FROM categories WHERE slug = 'beef'), 'Beef Brisket', 'beef-brisket', 'Halal beef brisket. Excellent for slow cooking and bbq.', 14.99, null, 22, true, false),
((SELECT id FROM categories WHERE slug = 'beef'), 'Beef Short Ribs', 'beef-short-ribs', 'Halal beef short ribs. Perfect for Korean BBQ or slow braising.', 17.99, null, 18, true, true),
((SELECT id FROM categories WHERE slug = 'beef'), 'Beef Burgers', 'beef-burgers', 'Halal beef burger patties, 4 pack. Ready for the grill.', 12.99, 14.99, 35, true, false),

-- Fish Products
((SELECT id FROM categories WHERE slug = 'fish'), 'Fresh Salmon Fillet', 'fresh-salmon-fillet', 'Fresh Atlantic salmon fillet. Rich in omega-3, perfect for grilling or baking.', 19.99, 22.99, 28, true, true),
((SELECT id FROM categories WHERE slug = 'fish'), 'Sea Bass Whole', 'sea-bass-whole', 'Fresh whole sea bass. Perfect for Mediterranean dishes.', 15.99, null, 20, true, true),
((SELECT id FROM categories WHERE slug = 'fish'), 'Cod Fillet', 'cod-fillet', 'Fresh cod fillet. Mild and flaky, great for fish and chips.', 13.99, null, 25, true, false),
((SELECT id FROM categories WHERE slug = 'fish'), 'King Prawns', 'king-prawns', 'Fresh large king prawns, peeled and deveined. Perfect for curries and stir-fry.', 16.99, 18.99, 30, true, true),
((SELECT id FROM categories WHERE slug = 'fish'), 'Mackerel Whole', 'mackerel-whole', 'Fresh whole mackerel. Perfect for grilling or smoking.', 8.99, null, 22, true, false);

-- Verify products were inserted
SELECT 
    p.name, 
    c.name as category, 
    p.price, 
    p.is_featured,
    p.is_available
FROM products p
JOIN categories c ON p.category_id = c.id
ORDER BY c.display_order, p.name;
