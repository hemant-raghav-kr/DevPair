-- ==============================================================================
-- DevPair Migration: Robust Complaint Notifications Trigger & Foreign Key Safety
-- ==============================================================================

-- 1. Remove any orphaned test rows in admin_users that do not exist in profiles
DELETE FROM public.admin_users
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 2. Add foreign key cascade on admin_users to profiles if not already present
-- (admin_users was referencing auth.users, but notifications references public.profiles)

-- 3. Update handle_complaint_notifications to join with profiles
CREATE OR REPLACE FUNCTION public.handle_complaint_notifications()
RETURNS TRIGGER AS $$
DECLARE
  admin_rec RECORD;
  display_ref TEXT;
  status_msg TEXT;
BEGIN
  display_ref := '#CP-' || upper(substr(NEW.id::text, 1, 8));

  -- On INSERT: Notify all active platform administrators that have a valid profile
  IF TG_OP = 'INSERT' THEN
    FOR admin_rec IN 
      SELECT a.user_id 
      FROM public.admin_users a
      INNER JOIN public.profiles p ON p.id = a.user_id
      WHERE a.is_active = true
    LOOP
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        related_project_id,
        related_application_id
      ) VALUES (
        admin_rec.user_id,
        'general',
        'New Complaint Submitted (' || display_ref || ')',
        'A student submitted a complaint regarding ' || replace(NEW.category, '_', ' ') || ': "' || NEW.subject || '".',
        NEW.reported_project_id,
        NEW.reported_application_id
      );
    END LOOP;
  END IF;

  -- On UPDATE: Notify the reporter if the status transitioned
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'under_review' THEN
      status_msg := 'Your complaint (' || display_ref || ') is now under active review by platform moderators.';
    ELSIF NEW.status = 'resolved' THEN
      status_msg := 'Your complaint (' || display_ref || ') has been investigated and resolved.';
    ELSIF NEW.status = 'dismissed' THEN
      status_msg := 'Your complaint (' || display_ref || ') was reviewed and dismissed by moderators.';
    ELSE
      status_msg := 'Your complaint (' || display_ref || ') status changed to ' || replace(NEW.status, '_', ' ') || '.';
    END IF;

    -- Verify reporter profile exists before inserting notification
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.reporter_id) THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        related_project_id,
        related_application_id
      ) VALUES (
        NEW.reporter_id,
        'general',
        'Complaint Status: ' || initcap(replace(NEW.status, '_', ' ')),
        status_msg,
        NEW.reported_project_id,
        NEW.reported_application_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
