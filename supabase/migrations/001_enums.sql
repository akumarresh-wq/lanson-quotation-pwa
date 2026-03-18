-- 001_enums.sql
-- Create all custom enum types for the Lanson Toyota Quotation PWA

CREATE TYPE user_role AS ENUM (
  'sales_officer',
  'team_leader',
  'branch_manager',
  'sales_vp',
  'coo',
  'jmd',
  'md',
  'admin'
);

CREATE TYPE approval_tier AS ENUM (
  'sales_vp',
  'coo',
  'director'
);

CREATE TYPE request_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'escalated'
);

CREATE TYPE fuel_type AS ENUM (
  'petrol',
  'diesel',
  'hybrid',
  'electric'
);

CREATE TYPE transmission_type AS ENUM (
  'mt',
  'at',
  'cvt',
  'ivt',
  'e_drive'
);
