-- Remove any stored "Umami Foods" reference from the live database.
-- Clears the category/product description fields that mention Umami.

UPDATE categories
SET description = NULL, updated_at = now()
WHERE description ILIKE '%umami%';

UPDATE products
SET description = NULL, updated_at = now()
WHERE description ILIKE '%umami%' OR seo_description ILIKE '%umami%';