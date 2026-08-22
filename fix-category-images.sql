-- ================================================================
-- Fix: Set category-specific image URLs based on category name
-- ------------------------------------------------------------
-- Each category gets a relevant Unsplash Source image so no two
-- categories look the same on the storefront.
--
-- Usage:
--   npm run fix:category-images
--   (or) paste directly into the Supabase SQL editor
--
-- Run this AFTER the schema has been applied and categories exist.
-- ================================================================

UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?seafood'                         WHERE slug = 'meats-seafood';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?frozen-fish'                       WHERE slug = 'frozen-sea-food';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?frozen-chicken'                      WHERE slug = 'frozen-meat-poultry';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?fresh-meat'                          WHERE slug = 'fresh-meat';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?eggs'                                WHERE slug = 'eggs';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?frozen-food'                         WHERE slug = 'frozen-food';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?frozen-vegetables'                    WHERE slug = 'frozen-vegtables';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?nuts,dried-fruit'                    WHERE slug = 'dry-fruits-and-nuts';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?grains,millet'                        WHERE slug = 'grains-millets';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?wheat,grain'                            WHERE slug = 'wheat-grains';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?lentils'                               WHERE slug = 'lentils';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?rice'                                  WHERE slug = 'rice';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?flour'                                 WHERE slug = 'flours-atta';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?cooking-oil'                           WHERE slug = 'oils';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?spices'                                WHERE slug = 'spices';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?condiments'                            WHERE slug = 'condiments-kitchen';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?sauce'                                 WHERE slug = 'sauces';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?jam'                                   WHERE slug = 'jams-spread';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?spice-powder'                          WHERE slug = 'powder-grains';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?canned-goods'                           WHERE slug = 'canned-foods';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?canned-food'                            WHERE slug = 'precooked-canned-food';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?ready-meal'                            WHERE slug = 'ready-meals';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?snacks'                                WHERE slug = 'snacks-crisps';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?bakery'                                WHERE slug = 'bakery';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?cereal'                                WHERE slug = 'cereals';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?tea'                                   WHERE slug = 'tea-and-coffee';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?juice'                                 WHERE slug = 'drinks-juice-beverage';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?chocolate'                             WHERE slug = 'sweets-choclates';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?candy'                                 WHERE slug = 'confectionery';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?grocery'                               WHERE slug = 'grocery-staples';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?cheese'                                WHERE slug = 'milk-cheese-youghurt';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?dairy'                                 WHERE slug = 'dairy-chilled-food';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?vegetables'                            WHERE slug = 'vegtables-fruits';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?cosmetics'                             WHERE slug = 'cosmetic';
UPDATE categories SET image_url = 'https://source.unsplash.com/400x400/?grocery'                               WHERE slug = 'general';