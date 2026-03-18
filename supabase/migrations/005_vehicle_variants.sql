-- 005_vehicle_variants.sql
-- Variants within each vehicle model

CREATE TABLE vehicle_variants (
  id           uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id     uuid              NOT NULL REFERENCES vehicle_models(id),
  name         text              NOT NULL,
  fuel         fuel_type         NOT NULL,
  transmission transmission_type NOT NULL,
  is_active    boolean           NOT NULL DEFAULT true,
  created_at   timestamptz       NOT NULL DEFAULT now(),

  UNIQUE (model_id, name)
);
