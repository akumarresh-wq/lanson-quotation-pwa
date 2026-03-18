-- 012_quotations.sql
-- Generated quotations (PDF-ready snapshots)

CREATE TABLE quotations (
  id                   uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number     text    NOT NULL UNIQUE DEFAULT generate_qt_number(),
  discount_request_id  uuid    REFERENCES discount_requests(id),
  variant_id           uuid    NOT NULL REFERENCES vehicle_variants(id),
  customer_id          uuid    NOT NULL REFERENCES customers(id),
  created_by           uuid    NOT NULL REFERENCES profiles(id),
  ex_showroom          bigint  NOT NULL,
  gst                  bigint  NOT NULL DEFAULT 0,
  tcs                  bigint  NOT NULL DEFAULT 0,
  insurance            bigint  NOT NULL DEFAULT 0,
  rto                  bigint  NOT NULL DEFAULT 0,
  fastag               bigint  NOT NULL DEFAULT 0,
  accessories          bigint  NOT NULL DEFAULT 0,
  discount             bigint  NOT NULL DEFAULT 0,
  on_road              bigint  NOT NULL,
  shared_via_whatsapp  boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);
