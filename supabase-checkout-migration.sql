-- ============================================================
-- Checkout & payment upgrade
-- Adds payment-method / delivery-slot columns to orders.
-- Idempotent — safe to run more than once.
-- Run in Supabase Studio → SQL Editor.
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30);
-- 'card' | 'pay_on_delivery'

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_slot VARCHAR(50);
-- e.g. '14:00-16:00' (validated against src/lib/delivery-slots.ts)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_recorded_by UUID REFERENCES admin_users(id);

CREATE INDEX IF NOT EXISTS idx_orders_slot ON orders(delivery_date, delivery_slot)
  WHERE status <> 'cancelled';

COMMENT ON COLUMN orders.payment_method IS 'How the customer chose to pay: card (Stripe Checkout) or pay_on_delivery';
COMMENT ON COLUMN orders.paid_at IS 'When payment was confirmed (webhook for card, admin mark-received for pay-on-delivery)';
