-- 015_rls.sql
-- Row Level Security policies for every table

-- ============================================================
-- branches
-- ============================================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branches are viewable by all authenticated users"
  ON branches FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- profiles
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by all authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- vehicle_models
-- ============================================================
ALTER TABLE vehicle_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle models are viewable by all authenticated users"
  ON vehicle_models FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- vehicle_variants
-- ============================================================
ALTER TABLE vehicle_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle variants are viewable by all authenticated users"
  ON vehicle_variants FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- price_lists
-- ============================================================
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Price lists are viewable by all authenticated users"
  ON price_lists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert price lists"
  ON price_lists FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- price_list_items
-- ============================================================
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Price list items are viewable by all authenticated users"
  ON price_list_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert price list items"
  ON price_list_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- customers
-- ============================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customers or same-branch customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- discount_requests
-- ============================================================
ALTER TABLE discount_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own, assigned, or same-branch discount requests"
  ON discount_requests FOR SELECT
  TO authenticated
  USING (
    requested_by = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles AS requester
      JOIN profiles AS viewer ON viewer.id = auth.uid()
      WHERE requester.id = discount_requests.requested_by
        AND requester.branch_id = viewer.branch_id
        AND viewer.role IN ('branch_manager', 'team_leader', 'sales_vp', 'coo', 'jmd', 'md', 'admin')
    )
  );

CREATE POLICY "Authenticated users can insert discount requests"
  ON discount_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Assigned approver can update discount requests"
  ON discount_requests FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- ============================================================
-- approval_log
-- ============================================================
ALTER TABLE approval_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approval logs for requests they can see"
  ON approval_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM discount_requests dr
      WHERE dr.id = approval_log.request_id
        AND (
          dr.requested_by = auth.uid()
          OR dr.assigned_to = auth.uid()
          OR EXISTS (
            SELECT 1 FROM profiles AS requester
            JOIN profiles AS viewer ON viewer.id = auth.uid()
            WHERE requester.id = dr.requested_by
              AND requester.branch_id = viewer.branch_id
              AND viewer.role IN ('branch_manager', 'team_leader', 'sales_vp', 'coo', 'jmd', 'md', 'admin')
          )
        )
    )
  );

-- ============================================================
-- quotations
-- ============================================================
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own or same-branch quotations"
  ON quotations FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles AS creator
      JOIN profiles AS viewer ON viewer.id = auth.uid()
      WHERE creator.id = quotations.created_by
        AND creator.branch_id = viewer.branch_id
    )
  );

CREATE POLICY "Authenticated users can insert quotations"
  ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- notifications
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
