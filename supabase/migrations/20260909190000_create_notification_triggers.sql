-- ==============================================================================
-- DevPair Migration: Automatic Application Notifications Triggers
-- Creates notifications on application submission, accept, reject, and withdraw
-- ==============================================================================

-- Ensure notifications table has full replica identity for realtime filter support
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Ensure public.notifications is in supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- ------------------------------------------------------------------------------
-- Function: handle_application_notification
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_application_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_project_owner_id UUID;
  v_project_title TEXT;
  v_applicant_name TEXT;
  v_role_title TEXT := NULL;
  v_message TEXT;
BEGIN
  -- Retrieve project details
  SELECT owner_id, title INTO v_project_owner_id, v_project_title
  FROM public.projects
  WHERE id = NEW.project_id;

  -- Retrieve applicant name
  SELECT COALESCE(full_name, username, 'A student') INTO v_applicant_name
  FROM public.profiles
  WHERE id = NEW.applicant_id;

  -- Retrieve role title if role_id is present
  IF NEW.role_id IS NOT NULL THEN
    SELECT title INTO v_role_title
    FROM public.project_roles
    WHERE id = NEW.role_id;
  END IF;

  -- Case 1: NEW application submitted (INSERT)
  IF (TG_OP = 'INSERT') THEN
    IF v_role_title IS NOT NULL THEN
      v_message := v_applicant_name || ' applied to join "' || v_project_title || '" as ' || v_role_title || '.';
    ELSE
      v_message := v_applicant_name || ' submitted a join request for "' || v_project_title || '".';
    END IF;

    -- Only notify if applicant is not the project owner
    IF v_project_owner_id IS NOT NULL AND v_project_owner_id != NEW.applicant_id THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        related_project_id,
        related_application_id,
        read
      ) VALUES (
        v_project_owner_id,
        'application_received',
        'New Join Request',
        v_message,
        NEW.project_id,
        NEW.id,
        false
      );
    END IF;

  -- Case 2: Status changed (UPDATE)
  ELSIF (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Subcase 2a: Accepted -> Notify applicant
    IF NEW.status = 'accepted' THEN
      IF v_role_title IS NOT NULL THEN
        v_message := 'Congratulations! Your application to join "' || v_project_title || '" as ' || v_role_title || ' was accepted.';
      ELSE
        v_message := 'Congratulations! Your application to join "' || v_project_title || '" was accepted.';
      END IF;

      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        related_project_id,
        related_application_id,
        read
      ) VALUES (
        NEW.applicant_id,
        'application_status_updated',
        'Application Accepted',
        v_message,
        NEW.project_id,
        NEW.id,
        false
      );

    -- Subcase 2b: Rejected -> Notify applicant
    ELSIF NEW.status = 'rejected' THEN
      IF v_role_title IS NOT NULL THEN
        v_message := 'Your application to join "' || v_project_title || '" for ' || v_role_title || ' was not accepted.';
      ELSE
        v_message := 'Your application to join "' || v_project_title || '" was not accepted.';
      END IF;

      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        related_project_id,
        related_application_id,
        read
      ) VALUES (
        NEW.applicant_id,
        'application_status_updated',
        'Application Update',
        v_message,
        NEW.project_id,
        NEW.id,
        false
      );

    -- Subcase 2c: Withdrawn -> Notify project owner
    ELSIF NEW.status = 'withdrawn' THEN
      IF v_role_title IS NOT NULL THEN
        v_message := v_applicant_name || ' withdrew their application for "' || v_project_title || '" (' || v_role_title || ').';
      ELSE
        v_message := v_applicant_name || ' withdrew their application for "' || v_project_title || '".';
      END IF;

      IF v_project_owner_id IS NOT NULL AND v_project_owner_id != NEW.applicant_id THEN
        INSERT INTO public.notifications (
          user_id,
          type,
          title,
          message,
          related_project_id,
          related_application_id,
          read
        ) VALUES (
          v_project_owner_id,
          'application_status_updated',
          'Application Withdrawn',
          v_message,
          NEW.project_id,
          NEW.id,
          false
        );
      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ------------------------------------------------------------------------------
-- Triggers on public.applications
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_application_notifications ON public.applications;
CREATE TRIGGER trg_application_notifications
  AFTER INSERT OR UPDATE OF status ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_application_notification();
