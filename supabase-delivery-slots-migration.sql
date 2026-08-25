-- ============================================================================
-- ADMIN-CONTROLLED DELIVERY SLOTS
-- ============================================================================
-- Replaces the hard-coded slot list with a fully admin-managed system:
--
--   delivery_slots             recurring weekly schedule (day + time + capacity)
--   delivery_slot_overrides    date-specific closures / capacity changes
--   delivery_slot_bookings     atomic per-date counters (prevents overbooking)
--   reserve_delivery_slot()    row-locked RPC — concurrent-safe reservation
--   release_delivery_slot()    gives capacity back when an order is cancelled
--
-- Idempotent: safe to run multiple times.
-- ============================================================================

-- ---------------------------------------------------------------- weekly ----
CREATE TABLE IF NOT EXISTS delivery_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun .. 6=Sat
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_orders INTEGER NOT NULL DEFAULT 8 CHECK (max_orders > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------- overrides ----
-- slot_id NULL  => the row applies to the WHOLE day (e.g. Eid/Christmas close).
-- is_closed     => slot/day cannot take orders.
-- max_orders    => temporary capacity for that date (falls back to schedule).
CREATE TABLE IF NOT EXISTS delivery_slot_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    slot_id UUID REFERENCES delivery_slots(id) ON DELETE CASCADE,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    max_orders INTEGER CHECK (max_orders IS NULL OR max_orders > 0),
    note VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (date, slot_id)
);

-- Whole-day rows use NULL slot_id; Postgres treats NULLs as distinct in a
-- UNIQUE constraint, so enforce "at most one whole-day override per date" here.
CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_slot_overrides_day
    ON delivery_slot_overrides (date) WHERE slot_id IS NULL;

-- Prevent duplicate recurring slots on the same day + time window.
CREATE UNIQUE INDEX IF NOT EXISTS uq_delivery_slots_day_window
    ON delivery_slots (day_of_week, start_time, end_time);

-- -------------------------------------------------------------- bookings ----
CREATE TABLE IF NOT EXISTS delivery_slot_bookings (
    booking_date DATE NOT NULL,
    slot_id UUID REFERENCES delivery_slots(id) ON DELETE CASCADE,
    booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (booking_date, slot_id)
);

-- Human-readable booking inputs are stored alongside the FK so order history is
-- readable even if a slot is later deleted from the weekly schedule.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_slot VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_slot_id UUID REFERENCES delivery_slots(id);
CREATE INDEX IF NOT EXISTS idx_orders_slot_date ON orders(delivery_date, delivery_slot_id);
CREATE INDEX IF NOT EXISTS idx_orders_slot_label ON orders(delivery_date, delivery_slot);

DROP TRIGGER IF EXISTS update_delivery_slots_updated_at ON delivery_slots;
CREATE TRIGGER update_delivery_slots_updated_at BEFORE UPDATE ON delivery_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------- atomic reservation -------
-- Row-locks the booking counter, re-checks effective capacity (override >
-- schedule) and increments only if room remains. Concurrent orders queue on
-- the lock, so a slot can NEVER be overbooked. Returns true = reserved.
CREATE OR REPLACE FUNCTION reserve_delivery_slot(p_date DATE, p_slot_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_slot       delivery_slots%ROWTYPE;
    o            delivery_slot_overrides%ROWTYPE;
    v_max        INTEGER;
    v_booked     INTEGER := 0;
BEGIN
    SELECT * INTO v_slot FROM delivery_slots WHERE id = p_slot_id FOR UPDATE;
    IF NOT FOUND OR NOT v_slot.is_active THEN
        RETURN FALSE;
    END IF;

    -- whole-day closure blocks every slot on that date
    SELECT * INTO o FROM delivery_slot_overrides
     WHERE date = p_date AND slot_id IS NULL FOR UPDATE;
    IF FOUND AND o.is_closed THEN RETURN FALSE; END IF;

    -- slot-specific override wins over the weekly default
    SELECT * INTO o FROM delivery_slot_overrides
     WHERE date = p_date AND slot_id = p_slot_id FOR UPDATE;
    IF FOUND THEN
        IF o.is_closed THEN RETURN FALSE; END IF;
        v_max := COALESCE(o.max_orders, v_slot.max_orders);
    ELSE
        v_max := v_slot.max_orders;
    END IF;

    IF v_max IS NULL OR v_max <= 0 THEN RETURN FALSE; END IF;

    INSERT INTO delivery_slot_bookings (booking_date, slot_id, booked_count)
    VALUES (p_date, p_slot_id, 0)
    ON CONFLICT (booking_date, slot_id) DO NOTHING;

    SELECT booked_count INTO v_booked
      FROM delivery_slot_bookings
     WHERE booking_date = p_date AND slot_id = p_slot_id
       FOR UPDATE;

    IF v_booked >= v_max THEN
        RETURN FALSE; -- FULL
    END IF;

    UPDATE delivery_slot_bookings
       SET booked_count = booked_count + 1, updated_at = NOW()
     WHERE booking_date = p_date AND slot_id = p_slot_id;

    RETURN TRUE;
END;
$$;

-- Give capacity back when an order is cancelled / payment fails post-reserve.
CREATE OR REPLACE FUNCTION release_delivery_slot(p_date DATE, p_slot_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_slot_id IS NULL OR p_date IS NULL THEN RETURN; END IF;
    UPDATE delivery_slot_bookings
       SET booked_count = GREATEST(booked_count - 1, 0), updated_at = NOW()
     WHERE booking_date = p_date AND slot_id = p_slot_id;
END;
$$;

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE delivery_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_slot_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_slot_bookings ENABLE ROW LEVEL SECURITY;

-- Schedule + overrides: everyone can READ (storefront availability),
-- only active admins can write.
DROP POLICY IF EXISTS "Anyone can view delivery slots" ON delivery_slots;
CREATE POLICY "Anyone can view delivery slots" ON delivery_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage delivery slots" ON delivery_slots;
CREATE POLICY "Admins can manage delivery slots" ON delivery_slots FOR ALL USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);

DROP POLICY IF EXISTS "Anyone can view slot overrides" ON delivery_slot_overrides;
CREATE POLICY "Anyone can view slot overrides" ON delivery_slot_overrides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage slot overrides" ON delivery_slot_overrides;
CREATE POLICY "Admins can manage slot overrides" ON delivery_slot_overrides FOR ALL USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);

-- Bookings: admin-read ONLY. Customers/guests reserve exclusively through the
-- SECURITY DEFINER reserve_delivery_slot() function — never direct writes.
DROP POLICY IF EXISTS "Admins can view slot bookings" ON delivery_slot_bookings;
CREATE POLICY "Admins can view slot bookings" ON delivery_slot_bookings FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);

REVOKE ALL ON FUNCTION reserve_delivery_slot(DATE, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_delivery_slot(DATE, UUID) TO anon, authenticated;
REVOKE ALL ON FUNCTION release_delivery_slot(DATE, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION release_delivery_slot(DATE, UUID) TO anon, authenticated;

-- ============================================================================
-- SEED — recurring weekly schedule (idempotent)
-- Mon–Fri: four windows @ 8 orders (matches previous hard-coded behaviour).
-- Saturday: customer-requested example — 10-12@5, 12-14@5, 14-16@8, 16-18 OFF.
-- Sunday: closed (no active slots).
-- ============================================================================
INSERT INTO delivery_slots (day_of_week, start_time, end_time, max_orders, is_active, display_order) VALUES
    -- Monday..Friday
    (1,'09:00','11:00',8,true,1),(1,'11:00','13:00',8,true,2),(1,'14:00','16:00',8,true,3),(1,'16:00','18:00',8,true,4),
    (2,'09:00','11:00',8,true,1),(2,'11:00','13:00',8,true,2),(2,'14:00','16:00',8,true,3),(2,'16:00','18:00',8,true,4),
    (3,'09:00','11:00',8,true,1),(3,'11:00','13:00',8,true,2),(3,'14:00','16:00',8,true,3),(3,'16:00','18:00',8,true,4),
    (4,'09:00','11:00',8,true,1),(4,'11:00','13:00',8,true,2),(4,'14:00','16:00',8,true,3),(4,'16:00','18:00',8,true,4),
    (5,'09:00','11:00',8,true,1),(5,'11:00','13:00',8,true,2),(5,'14:00','16:00',8,true,3),(5,'16:00','18:00',8,true,4),
    -- Saturday (example config: last window disabled = CLOSED)
    (6,'10:00','12:00',5,true,1),(6,'12:00','14:00',5,true,2),(6,'14:00','16:00',8,true,3),(6,'16:00','18:00',8,false,4)
ON CONFLICT DO NOTHING;

