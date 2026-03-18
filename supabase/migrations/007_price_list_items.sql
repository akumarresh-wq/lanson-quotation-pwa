-- 007_price_list_items.sql
-- Individual variant pricing within a price list

CREATE TABLE price_list_items (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id uuid    NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  variant_id    uuid    NOT NULL REFERENCES vehicle_variants(id),
  ex_showroom   bigint  NOT NULL,
  gst           bigint  NOT NULL DEFAULT 0,
  tcs           bigint  NOT NULL DEFAULT 0,
  insurance     bigint  NOT NULL DEFAULT 0,
  rto           bigint  NOT NULL DEFAULT 0,
  fastag        bigint  NOT NULL DEFAULT 0,
  accessories   bigint  NOT NULL DEFAULT 0,
  on_road       bigint  NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (price_list_id, variant_id)
);

-- Ensure on_road equals sum of components
ALTER TABLE price_list_items
  ADD CONSTRAINT price_list_items_on_road_check
  CHECK (on_road = ex_showroom + gst + tcs + insurance + rto + fastag + accessories);
