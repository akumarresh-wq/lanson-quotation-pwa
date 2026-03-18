-- 014_functions.sql
-- Core business-logic functions and triggers

-- 1. Determine which approval tier a discount amount falls into
CREATE OR REPLACE FUNCTION determine_approval_tier(amount bigint)
RETURNS approval_tier
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF amount <= 30000 THEN
    RETURN 'sales_vp';
  ELSIF amount <= 200000 THEN
    RETURN 'coo';
  ELSE
    RETURN 'director';
  END IF;
END;
$$;

-- 2. Find the approver for a given tier and (optional) branch
CREATE OR REPLACE FUNCTION find_approver(
  p_tier      approval_tier,
  p_branch_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  approver_id uuid;
BEGIN
  IF p_tier = 'sales_vp' THEN
    SELECT id INTO approver_id
    FROM profiles
    WHERE role = 'sales_vp'
      AND is_active = true
      AND (branch_id = p_branch_id OR branch_id IS NULL)
    ORDER BY branch_id NULLS LAST
    LIMIT 1;

  ELSIF p_tier = 'coo' THEN
    SELECT id INTO approver_id
    FROM profiles
    WHERE role = 'coo'
      AND is_active = true
    LIMIT 1;

  ELSIF p_tier = 'director' THEN
    SELECT id INTO approver_id
    FROM profiles
    WHERE role IN ('jmd', 'md')
      AND is_active = true
    LIMIT 1;
  END IF;

  RETURN approver_id;
END;
$$;

-- 3. BEFORE INSERT trigger: auto-route discount requests
CREATE OR REPLACE FUNCTION route_discount_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requestor_branch uuid;
BEGIN
  -- Look up the requestor's branch
  SELECT branch_id INTO requestor_branch
  FROM profiles
  WHERE id = NEW.requested_by;

  -- Set the approval tier based on amount
  NEW.approval_tier := determine_approval_tier(NEW.discount_amount);

  -- Find and assign the correct approver
  NEW.assigned_to := find_approver(NEW.approval_tier, requestor_branch);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_route_discount_request
  BEFORE INSERT ON discount_requests
  FOR EACH ROW
  EXECUTE FUNCTION route_discount_request();

-- 4. Process an approval / rejection / escalation action
CREATE OR REPLACE FUNCTION process_approval(
  p_request_id uuid,
  p_action     text,
  p_actor_id   uuid,
  p_remarks    text DEFAULT NULL,
  p_amount     bigint DEFAULT NULL
)
RETURNS discount_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request discount_requests;
BEGIN
  -- Lock the row and verify the actor is the assigned approver
  SELECT * INTO v_request
  FROM discount_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Discount request % not found', p_request_id;
  END IF;

  IF v_request.assigned_to IS DISTINCT FROM p_actor_id THEN
    RAISE EXCEPTION 'You are not the assigned approver for this request';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is no longer pending (current status: %)', v_request.status;
  END IF;

  -- Update the discount request
  UPDATE discount_requests
  SET
    status          = p_action::request_status,
    approved_amount = CASE WHEN p_action = 'approved' THEN COALESCE(p_amount, discount_amount) ELSE approved_amount END,
    approved_by     = CASE WHEN p_action = 'approved' THEN p_actor_id ELSE approved_by END,
    approved_at     = CASE WHEN p_action = 'approved' THEN now() ELSE approved_at END,
    updated_at      = now()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  -- Insert audit log entry
  INSERT INTO approval_log (request_id, action, actor_id, remarks, approved_amount)
  VALUES (p_request_id, p_action, p_actor_id, p_remarks, p_amount);

  RETURN v_request;
END;
$$;

-- 5. AFTER INSERT trigger: create notification for the assigned approver
CREATE OR REPLACE FUNCTION notify_on_discount_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requestor_name text;
BEGIN
  IF NEW.assigned_to IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO requestor_name
  FROM profiles
  WHERE id = NEW.requested_by;

  INSERT INTO notifications (user_id, title, body, type, reference_id)
  VALUES (
    NEW.assigned_to,
    'New Discount Request ' || NEW.request_number,
    COALESCE(requestor_name, 'A sales officer') || ' requested a discount of ₹' || NEW.discount_amount,
    'discount_request',
    NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_discount_request
  AFTER INSERT ON discount_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_discount_request();
