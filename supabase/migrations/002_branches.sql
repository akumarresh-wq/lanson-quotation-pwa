-- 002_branches.sql
-- Branches / showroom locations

CREATE TABLE branches (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  code       text        NOT NULL UNIQUE,
  zone       text        NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
