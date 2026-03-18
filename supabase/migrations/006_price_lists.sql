-- 006_price_lists.sql
-- Monthly / periodic price lists uploaded by admin

CREATE TABLE price_lists (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text        NOT NULL,
  effective_from date        NOT NULL,
  effective_to   date,
  uploaded_by    uuid        REFERENCES profiles(id),
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);
