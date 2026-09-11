-- ==============================================================================
-- DevPair Migration: Withdrawal Cooldowns, Team Member Removal, and Admin Audit Logs
-- ==============================================================================

-- 1. Extend applications status check constraint to include 'removed'
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'removed'));

-- 2. Create withdrawal_cooldowns table
CREATE TABLE IF NOT EXISTS public.withdrawal_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  cooldown_until TIMESTAMPTZ NOT NULL,
  reason TEXT DEFAULT 'Voluntary application withdrawal',
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_cooldowns_user_id 
  ON public.withdrawal_cooldowns (user_id);

CREATE INDEX IF NOT EXISTS idx_withdrawal_cooldowns_active 
  ON public.withdrawal_cooldowns (user_id, cooldown_until) 
  WHERE revoked_at IS NULL;

DROP TRIGGER IF EXISTS trg_withdrawal_cooldowns_updated_at ON public.withdrawal_cooldowns;
CREATE TRIGGER trg_withdrawal_cooldowns_updated_at
  BEFORE UPDATE ON public.withdrawal_cooldowns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on withdrawal_cooldowns
ALTER TABLE public.withdrawal_cooldowns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cooldowns" ON public.withdrawal_cooldowns;
CREATE POLICY "Users can view own cooldowns"
  ON public.withdrawal_cooldowns FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all cooldowns" ON public.withdrawal_cooldowns;
CREATE POLICY "Admins can view all cooldowns"
  ON public.withdrawal_cooldowns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

-- 3. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'application_withdrawn',
    'withdrawal_cooldown_created',
    'team_member_removed',
    'withdrawal_cooldown_revoked'
  )),
  actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  role_id UUID REFERENCES public.project_roles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON public.audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON public.audit_logs (target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON public.audit_logs (project_id);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and Super Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins and Super Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

-- 4. Enforce withdrawal cooldown on new application submission
CREATE OR REPLACE FUNCTION public.check_withdrawal_cooldown()
RETURNS TRIGGER AS $$
DECLARE
  v_cooldown_until TIMESTAMPTZ;
BEGIN
  SELECT cooldown_until INTO v_cooldown_until
  FROM public.withdrawal_cooldowns
  WHERE user_id = NEW.applicant_id
    AND revoked_at IS NULL
    AND cooldown_until > now()
  ORDER BY cooldown_until DESC
  LIMIT 1;

  IF v_cooldown_until IS NOT NULL THEN
    RAISE EXCEPTION 'You are currently on a withdrawal cooldown. You can apply again after %.',
      to_char(v_cooldown_until AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS "UTC"');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_check_withdrawal_cooldown ON public.applications;
CREATE TRIGGER trg_check_withdrawal_cooldown
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.check_withdrawal_cooldown();

-- 5. Update handle_application_notification() to support 'removed' and applicant 'withdrawn' notifications
CREATE OR REPLACE FUNCTION public.handle_application_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_applicant_name TEXT;
  v_project_title TEXT;
  v_project_owner_id UUID;
  v_role_title TEXT;
  v_message TEXT;
BEGIN
  -- Retrieve applicant name
  SELECT COALESCE(full_name, username, 'A student')
  INTO v_applicant_name
  FROM public.profiles
  WHERE id = NEW.applicant_id;

  -- Retrieve project details
  SELECT title, owner_id
  INTO v_project_title, v_project_owner_id
  FROM public.projects
  WHERE id = NEW.project_id;

  -- Retrieve role title if role_id is present
  IF NEW.role_id IS NOT NULL THEN
    SELECT title
    INTO v_role_title
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

    -- Subcase 2c: Withdrawn -> Notify project owner and applicant
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

      -- Also send confirmation notification to applicant
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
        'Application Withdrawn',
        'You have withdrawn your application for "' || v_project_title || '".',
        NEW.project_id,
        NEW.id,
        false
      );

    -- Subcase 2d: Removed -> Notify applicant of owner kick
    ELSIF NEW.status = 'removed' THEN
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
        'Removed from project',
        'You have been removed from ' || v_project_title || ' by the project owner.',
        NEW.project_id,
        NEW.id,
        false
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
