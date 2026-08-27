-- ============================================================================
-- 15-MINUTE CARD DELIVERY-SLOT RESERVATIONS
-- ============================================================================
-- For CARD payments, a chosen delivery slot is temporarily reserved for 15
-- minutes while the customer completes Stripe Checkout.
--
--   delivery_slot_reservations  temporary holds keyed to a delivery slot
--   reserve_delivery_slot_reservation()   atomic temp reserve (concurrent-safe)
--   confirm_delivery_slot_reservation()   temp -> permanent (payment confirmed)
--   release_delivery_slot_reservation()   cancel / payment-failed release
--   expire_stale_delivery_slot_reservations()  optional sweep (housekeeping)
--
-- Capacity accounting:
--   * CONFIRMED (permanent) capacity lives in delivery_slot_bookings.booked_count
--     (unchanged -- used by Pay on Delivery and confirmed card orders).
--   * An ACTIVE & UNEXPIRED reservation counts toward capacity.
--   * EXPIRED reservations NEVER count toward capacity -- correctness does NOT
--     depend on a cleanup job; every availability calc filters on expires_at.
--
-- Pay on Delivery does NOT use this table -- it consumes capacity immediately
-- via the existing reserve_delivery_slot() RPC.
--
-- Idempotent: safe to run multiple times.
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_slot_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_date DATE NOT NULL,
    delivery_slot_id UUID REFERENCES delivery_slots(id) ON DELETE CASCADE,
    -- Populated after the order is created (the reservation is made before the
    -- order row exists so the slot is atomically held while we build the order).
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE','CONFIRMED','RELEASED','EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup of live reservations per date+slot (used by availability) and
-- per order (used by the Stripe webhook).
CREATE INDEX IF NOT EXISTS idx_slot_reservations_live
    ON delivery_slot_reservations (delivery_date, delivery_slot_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_slot_reservations_order
    ON delivery_slot_reservations (order_id);

DROP TRIGGER IF EXISTS update_delivery_slot_reservations_updated_at ON delivery_slot_reservations;
CREATE TRIGGER update_delivery_slot_reservations_updated_at
    BEFORE UPDATE ON delivery_slot_reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------- atomic temp reserve ------
-- Atomic temporary reserve. Row-locks the slot, re-checks closure/overrides and
-- capacity (confirmed bookings + ACTIVE, unexpired reservations) and inserts an
-- ACTIVE reservation ONLY if room remains. Concurrent card checkouts that race
-- for the last unit serialise on the slot lock, so a slot can never be
-- over-reserved. Returns the new reservation id, or NULL when unavailable.
CREATE OR REPLACE FUNCTION reserve_delivery_slot_reservation(
    p_date DATE,
    p_slot_id UUID,
    p_expires_at TIMESTAMPTZ
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_slot    delivery_slots%ROWTYPE;
    o         delivery_slot_overrides%ROWTYPE;
    v_max     INTEGER;
    v_booked  INTEGER := 0;
    v_active  INTEGER := 0;
    v_id      UUID;
BEGIN
    SELECT * INTO v_slot FROM delivery_slots WHERE id = p_slot_id FOR UPDATE;
    IF NOT FOUND OR NOT v_slot.is_active THEN
        RETURN NULL;
    END IF;

    SELECT * INTO o FROM delivery_slot_overrides
     WHERE date = p_date AND slot_id IS NULL FOR UPDATE;
    IF FOUND AND o.is_closed THEN RETURN NULL; END IF;

    SELECT * INTO o FROM delivery_slot_overrides
     WHERE date = p_date AND slot_id = p_slot_id FOR UPDATE;
    IF FOUND THEN
        IF o.is_closed THEN RETURN NULL; END IF;
        v_max := COALESCE(o.max_orders, v_slot.max_orders);
    ELSE
        v_max := v_slot.max_orders;
    END IF;

    IF v_max IS NULL OR v_max <= 0 THEN RETURN NULL; END IF;

    -- Occupied = confirmed bookings + ACTIVE & unexpired temporary holds.
    -- Expired reservations are ignored (lazy expiry) even before cleanup runs.
    SELECT COALESCE(booked_count, 0) INTO v_booked
      FROM delivery_slot_bookings
     WHERE booking_date = p_date AND slot_id = p_slot_id;

    SELECT COUNT(*) INTO v_active
      FROM delivery_slot_reservations
     WHERE delivery_date = p_date
       AND delivery_slot_id = p_slot_id
       AND status = 'ACTIVE'
       AND expires_at > NOW();

    IF v_booked + v_active >= v_max THEN
        RETURN NULL; -- FULL / no room
    END IF;

    INSERT INTO delivery_slot_reservations
        (delivery_date, delivery_slot_id, status, created_at, expires_at)
    VALUES
        (p_date, p_slot_id, 'ACTIVE', NOW(), p_expires_at)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;
-- ---------------------------------------------------------- confirmation ----
-- Convert a temporary ACTIVE reservation into PERMANENT capacity once Stripe
-- confirms payment. Idempotent (CONFIRMED -> true on replay).
--
--   * ACTIVE & unexpired: the reservation already owns a unit, so confirming
--     only re-buckets temp -> confirmed (net occupancy unchanged) and is always
--     safe, even at full capacity.
--   * EXPIRED (expires_at passed): the reservation no longer owns a unit. The
--     slot's real availability is re-checked under the lock:
--       - slot still available  -> confirm (increment booked_count);
--       - slot now full         -> do NOT overbook; mark EXPIRED, return false.
--   * RELEASED reservations can never be confirmed (return false).
CREATE OR REPLACE FUNCTION confirm_delivery_slot_reservation(p_reservation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    r              delivery_slot_reservations%ROWTYPE;
    v_slot         delivery_slots%ROWTYPE;
    v_override     delivery_slot_overrides%ROWTYPE;
    v_max          INTEGER;
    v_booked       INTEGER := 0;
    v_active       INTEGER := 0;
    v_own_active   BOOLEAN := false;
BEGIN
    IF p_reservation_id IS NULL THEN RETURN FALSE; END IF;

    -- Lock the reservation row so a concurrent release_delivery_slot_reservation
    -- cannot flip it to RELEASED between our read here and the CONFIRMED update
    -- below (which would otherwise permanently consume capacity for a released
    -- order). If release commits first, this read sees RELEASED and we bail.
    SELECT * INTO r FROM delivery_slot_reservations WHERE id = p_reservation_id FOR UPDATE;
    IF NOT FOUND THEN RETURN FALSE; END IF;

    -- idempotent: already confirmed is fine; released/expired can never confirm
    IF r.status = 'CONFIRMED' THEN RETURN TRUE; END IF;
    IF r.status IN ('RELEASED', 'EXPIRED') THEN RETURN FALSE; END IF;

    SELECT * INTO v_slot FROM delivery_slots WHERE id = r.delivery_slot_id FOR UPDATE;
    IF NOT FOUND OR NOT v_slot.is_active THEN
        PERFORM release_delivery_slot_reservation(p_reservation_id);
        RETURN FALSE;
    END IF;

    SELECT * INTO v_override FROM delivery_slot_overrides
     WHERE date = r.delivery_date AND slot_id IS NULL FOR UPDATE;
    IF FOUND AND v_override.is_closed THEN
        PERFORM release_delivery_slot_reservation(p_reservation_id);
        RETURN FALSE;
    END IF;

    SELECT * INTO v_override FROM delivery_slot_overrides
     WHERE date = r.delivery_date AND slot_id = r.delivery_slot_id FOR UPDATE;
    IF FOUND THEN
        IF v_override.is_closed THEN
            PERFORM release_delivery_slot_reservation(p_reservation_id);
            RETURN FALSE;
        END IF;
        v_max := COALESCE(v_override.max_orders, v_slot.max_orders);
    ELSE
        v_max := v_slot.max_orders;
    END IF;

    IF v_max IS NULL OR v_max <= 0 THEN
        PERFORM release_delivery_slot_reservation(p_reservation_id);
        RETURN FALSE;
    END IF;

    -- Was this reservation still "holding" a unit (expires_at in the future)?
    v_own_active := (r.status = 'ACTIVE' AND r.expires_at > NOW());

    IF NOT v_own_active THEN
        -- Reservation expired -> no longer blocks the slot. Only confirm if
        -- there really is room for one more (never overbook).
        SELECT COALESCE(booked_count, 0) INTO v_booked
        FROM delivery_slot_bookings
          WHERE booking_date = r.delivery_date AND slot_id = r.delivery_slot_id;

        SELECT COUNT(*) INTO v_active
          FROM delivery_slot_reservations
         WHERE delivery_date = r.delivery_date
           AND delivery_slot_id = r.delivery_slot_id
           AND status = 'ACTIVE'
           AND expires_at > NOW();

        IF v_booked + v_active >= v_max THEN
            UPDATE delivery_slot_reservations
               SET status = 'EXPIRED', updated_at = NOW()
             WHERE id = p_reservation_id;
            RETURN FALSE; -- slot no longer available -> do not overbook
        END IF;
    END IF;

    -- Convert the temporary unit into a permanent booking. When the reservation
    -- was still active this keeps net occupancy identical; when it had expired
    -- (room was available) this consumes the last free unit.
    INSERT INTO delivery_slot_bookings (booking_date, slot_id, booked_count)
    VALUES (r.delivery_date, r.delivery_slot_id, 0)
    ON CONFLICT (booking_date, slot_id) DO NOTHING;

    UPDATE delivery_slot_bookings
       SET booked_count = booked_count + 1, updated_at = NOW()
     WHERE booking_date = r.delivery_date AND slot_id = r.delivery_slot_id;

    UPDATE delivery_slot_reservations
       SET status = 'CONFIRMED', updated_at = NOW()
     WHERE id = p_reservation_id;

    RETURN TRUE;
END;
$$;
-- ---------------------------------------------------------------- release --
-- Cancel / payment-failure release. Only liberates a still-ACTIVE hold; does
-- nothing once confirmed (confirmed orders are managed elsewhere).
CREATE OR REPLACE FUNCTION release_delivery_slot_reservation(p_reservation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_reservation_id IS NULL THEN RETURN; END IF;
    UPDATE delivery_slot_reservations
       SET status = 'RELEASED', updated_at = NOW()
     WHERE id = p_reservation_id AND status = 'ACTIVE';
END;
$$;

-- ---------------------------------------------- housekeeping (optional) -----
-- Marks expired ACTIVE reservations as EXPIRED. Correctness does NOT depend on
-- this: every availability/confirm path already filters on expires_at. Run it
-- periodically (e.g. a cron / pg_cron) purely to ease admin reads.
CREATE OR REPLACE FUNCTION expire_stale_delivery_slot_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE delivery_slot_reservations
       SET status = 'EXPIRED', updated_at = NOW()
     WHERE status = 'ACTIVE' AND expires_at <= NOW();
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;
-- ============================================================================
-- RLS -- admin read-only for humans. Reservations are only ever written by the
-- server-side RPCs below (via the service-role / admin client) or by admin.
-- ============================================================================
ALTER TABLE delivery_slot_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view slot reservations" ON delivery_slot_reservations;
CREATE POLICY "Admins can view slot reservations" ON delivery_slot_reservations FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
);

REVOKE ALL ON FUNCTION reserve_delivery_slot_reservation(DATE, UUID, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_delivery_slot_reservation(DATE, UUID, TIMESTAMPTZ) TO anon, authenticated;
REVOKE ALL ON FUNCTION confirm_delivery_slot_reservation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION confirm_delivery_slot_reservation(UUID) TO anon, authenticated;
REVOKE ALL ON FUNCTION release_delivery_slot_reservation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION release_delivery_slot_reservation(UUID) TO anon, authenticated;
REVOKE ALL ON FUNCTION expire_stale_delivery_slot_reservations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION expire_stale_delivery_slot_reservations() TO anon, authenticated;