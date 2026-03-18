-- 016_seed.sql
-- Seed data: branches and vehicle models

-- Branches
INSERT INTO branches (name, code, zone) VALUES
  ('Koyambedu',     'KOY', 'South'),
  ('ECR',           'ECR', 'East'),
  ('Anna Nagar',    'ANN', 'West'),
  ('Chromepet',     'CHR', 'South'),
  ('Porur',         'POR', 'West'),
  ('Nungambakkam',  'NUN', 'Central');

-- Vehicle models (display_order follows the list order)
INSERT INTO vehicle_models (name, display_order) VALUES
  ('GLANZA',                1),
  ('URBAN CRUISER TAISOR',  2),
  ('RUMION',                3),
  ('URBAN CRUISER HYRYDER', 4),
  ('INNOVA HYCROSS',        5),
  ('INNOVA CRYSTA',         6),
  ('FORTUNER',              7),
  ('FORTUNER LEGENDER',     8),
  ('HILUX',                 9),
  ('CAMRY',                 10),
  ('VELLFIRE',              11),
  ('LAND CRUISER 300',      12),
  ('LAND CRUISER PRADO',    13);
