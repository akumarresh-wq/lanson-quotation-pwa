-- 010_discount_requests.sql
-- Discount requests submitted by sales staff, routed to approvers

CREATE TABLE discount_requests (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number  text           NOT NULL UNIQUE DEFAULT generate_dr_number(),
  variant_id      uuid           NOT NULL REFERENCES vehicle_variants(id),
  customer_id     uuid           NOT NULL REFERENCES customers(id),
  requested_by    uuid           NOT NULL REFERENCES profiles(id),
  discount_amount bigint         NOT NULL CHECK (discount_amount > 0),
  on_road_price   bigint         NOT NULL,
  remarks         text,
  status          request_status NOT NULL DEFAULT 'pending',
  approval_tier   approval_tier  NOT NULL,
  assigned_to     uuid           REFERENCES profiles(id),
  approved_amount bigint,
  approved_by     uuid           REFERENCES profiles(id),
  approved_at     timestamptz,
  created_at      timestamptz    NOT NULL DEFAULT now(),
  updated_at      timestamptz    NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_discount_requests_status       ON discount_requests (status);
CREATE INDEX idx_discount_requests_requested_by ON discount_requests (requested_by);
CREATE INDEX idx_discount_requests_assigned_to  ON discount_requests (assigned_to);

-- Re-use the set_updated_at trigger function from 003
CREATE TRIGGER discount_requests_updated_at
  BEFORE UPDATE ON discount_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
