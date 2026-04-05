-- Update global user roles to admin, organizer, volunteer

-- Normalize existing roles
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'volunteer';

UPDATE users SET role = 'admin' WHERE role IN ('moderator');
UPDATE users SET role = 'volunteer' WHERE role IN ('resident') OR role IS NULL;
UPDATE users SET role = 'volunteer'
WHERE role NOT IN ('admin', 'organizer', 'volunteer');

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'organizer', 'volunteer'));

-- Promote resource managers/owners to organizers automatically
CREATE OR REPLACE FUNCTION public.promote_user_to_organizer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invitation_status = 'accepted'
     AND NEW.role IN ('owner', 'manager', 'moderator') THEN
    UPDATE users
    SET role = CASE WHEN role = 'admin' THEN 'admin' ELSE 'organizer' END
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS promote_user_to_organizer ON resource_members;
DROP TRIGGER IF EXISTS promote_user_to_organizer_update ON resource_members;

CREATE TRIGGER promote_user_to_organizer
  AFTER INSERT ON resource_members
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_user_to_organizer();

CREATE TRIGGER promote_user_to_organizer_update
  AFTER UPDATE ON resource_members
  FOR EACH ROW
  WHEN (NEW.invitation_status = 'accepted' AND (OLD.invitation_status IS DISTINCT FROM 'accepted'))
  EXECUTE FUNCTION public.promote_user_to_organizer();


