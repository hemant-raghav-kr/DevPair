-- ==============================================================================
-- DevPair Migration: Enforce Role Slot Capacity on Application Acceptance
-- Atomically ensures that accepted applications for a role never exceed project_roles.slots
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_role_slot_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_role_slots INT;
  v_accepted_count INT;
BEGIN
  -- Only enforce when transitioning status to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') AND NEW.role_id IS NOT NULL THEN
    -- Retrieve role slot capacity
    SELECT slots INTO v_role_slots
    FROM public.project_roles
    WHERE id = NEW.role_id;

    IF v_role_slots IS NOT NULL THEN
      -- Count existing accepted applications for this role
      SELECT count(*) INTO v_accepted_count
      FROM public.applications
      WHERE role_id = NEW.role_id AND status = 'accepted' AND id != NEW.id;

      IF v_accepted_count >= v_role_slots THEN
        RAISE EXCEPTION 'Cannot accept application: role slot capacity (% of %) is already filled', v_accepted_count, v_role_slots;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_check_role_slot_capacity ON public.applications;
CREATE TRIGGER trg_check_role_slot_capacity
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.check_role_slot_capacity();
