-- Lock down user_roles table: block all direct writes
-- This prevents privilege escalation (any user inserting role='admin')

DROP POLICY IF EXISTS "No direct insert to user_roles" ON user_roles;
CREATE POLICY "No direct insert to user_roles" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "No direct update to user_roles" ON user_roles;
CREATE POLICY "No direct update to user_roles" ON user_roles
  FOR UPDATE TO authenticated
  USING (false);

DROP POLICY IF EXISTS "No direct delete from user_roles" ON user_roles;
CREATE POLICY "No direct delete from user_roles" ON user_roles
  FOR DELETE TO authenticated
  USING (false);