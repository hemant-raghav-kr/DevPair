-- ==============================================================================
-- DevPair Migration: Fix public.admin_users BEFORE DELETE trigger return value
-- In PostgreSQL BEFORE DELETE triggers, returning NULL (NEW) cancels the delete.
-- Must RETURN OLD for DELETE operations so Super Admin can remove admins.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.protect_canonical_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id = '02635888-ded4-4108-9fed-16fd43c7a3e5'::uuid THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot delete or remove the canonical Super Admin.';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF NEW.is_active IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Cannot deactivate the canonical Super Admin.';
      END IF;
      IF NEW.role IS DISTINCT FROM 'super_admin' THEN
        RAISE EXCEPTION 'Cannot demote or change the role of the canonical Super Admin.';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
