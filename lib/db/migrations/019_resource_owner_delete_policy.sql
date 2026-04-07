-- Allow resource submitters to delete their own listings (organizers), in addition to admins.
-- Keeps parity with UPDATE policy for owners/managers on resources.

DROP POLICY IF EXISTS "Admins can delete resources" ON resources;

CREATE POLICY "Admins or submitters can delete resources"
  ON resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
    OR submitted_by = auth.uid()
  );
