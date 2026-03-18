-- 009_sequences.sql
-- Sequences and helper functions for human-readable DR / QT numbers

CREATE SEQUENCE dr_number_seq START 1;
CREATE SEQUENCE qt_number_seq START 1;

-- Generate discount-request number: DR-2026-0001
CREATE OR REPLACE FUNCTION generate_dr_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  seq_val bigint;
BEGIN
  seq_val := nextval('dr_number_seq');
  RETURN 'DR-' || to_char(now(), 'YYYY') || '-' || lpad(seq_val::text, 4, '0');
END;
$$;

-- Generate quotation number: QT-2026-0001
CREATE OR REPLACE FUNCTION generate_qt_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  seq_val bigint;
BEGIN
  seq_val := nextval('qt_number_seq');
  RETURN 'QT-' || to_char(now(), 'YYYY') || '-' || lpad(seq_val::text, 4, '0');
END;
$$;
