-- 013_notifications.sql
-- In-app and push notification records

CREATE TABLE notifications (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES profiles(id),
  title         text        NOT NULL,
  body          text        NOT NULL,
  type          text        NOT NULL DEFAULT 'discount_request',
  reference_id  uuid,
  is_read       boolean     NOT NULL DEFAULT false,
  push_sent     boolean     NOT NULL DEFAULT false,
  whatsapp_sent boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_read ON notifications (user_id, is_read);
