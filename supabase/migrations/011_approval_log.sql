-- 011_approval_log.sql
-- Immutable audit trail of every approval / rejection / escalation action

CREATE TABLE approval_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid        NOT NULL REFERENCES discount_requests(id),
  action          text        NOT NULL CHECK (action IN ('approved', 'rejected', 'escalated')),
  actor_id        uuid        NOT NULL REFERENCES profiles(id),
  remarks         text,
  approved_amount bigint,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_approval_log_request_id ON approval_log (request_id);
