-- 008_customers.sql
-- Customer records created by sales staff

CREATE TABLE customers (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  phone      text        NOT NULL,
  email      text,
  created_by uuid        NOT NULL REFERENCES profiles(id),
  branch_id  uuid        REFERENCES branches(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
