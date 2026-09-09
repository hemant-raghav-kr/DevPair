-- ==============================================================================
-- DevPair Migration: Secure Complaint & Moderation System
-- ==============================================================================

-- 1. Create public.complaints table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  reported_application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT complaint_category_check CHECK (category IN (
    'harassment', 'inappropriate_content', 'spam', 'fake_profile',
    'abusive_behavior', 'project_misconduct', 'application_misconduct',
    'plagiarism', 'impersonation', 'other'
  )),
  CONSTRAINT complaint_status_check CHECK (status IN (
    'pending', 'under_review', 'resolved', 'dismissed'
  )),
  CONSTRAINT complaint_priority_check CHECK (priority IN (
    'low', 'normal', 'high', 'critical'
  )),
  CONSTRAINT complaint_target_check CHECK (
    (reported_user_id IS NOT NULL OR reported_project_id IS NOT NULL OR reported_application_id IS NOT NULL)
    OR category IN ('other', 'spam', 'inappropriate_content')
  ),
  CONSTRAINT complaint_no_self_report CHECK (
    reported_user_id IS NULL OR reporter_id != reported_user_id
  ),
  CONSTRAINT complaint_subject_length CHECK (
    char_length(trim(subject)) >= 3 AND char_length(subject) <= 150
  ),
  CONSTRAINT complaint_description_length CHECK (
    char_length(trim(description)) >= 10 AND char_length(description) <= 2500
  )
);

-- 2. Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_reporter ON public.complaints (reporter_id);
CREATE INDEX IF NOT EXISTS idx_complaints_reported_user ON public.complaints (reported_user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_reported_project ON public.complaints (reported_project_id);
CREATE INDEX IF NOT EXISTS idx_complaints_reported_app ON public.complaints (reported_application_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints (priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints (created_at DESC);

-- 3. Duplicate Prevention (Partial Unique Indexes)
-- Prevents abuse/spam while previous complaint for same target is still pending or under_review
CREATE UNIQUE INDEX IF NOT EXISTS idx_complaints_unique_pending_user 
  ON public.complaints (reporter_id, reported_user_id) 
  WHERE status IN ('pending', 'under_review') AND reported_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_complaints_unique_pending_project 
  ON public.complaints (reporter_id, reported_project_id) 
  WHERE status IN ('pending', 'under_review') AND reported_project_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_complaints_unique_pending_app 
  ON public.complaints (reporter_id, reported_application_id) 
  WHERE status IN ('pending', 'under_review') AND reported_application_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_complaints_unique_pending_general 
  ON public.complaints (reporter_id, category) 
  WHERE status IN ('pending', 'under_review') 
    AND reported_user_id IS NULL 
    AND reported_project_id IS NULL 
    AND reported_application_id IS NULL;

-- 4. Automatically update updated_at timestamp
DROP TRIGGER IF EXISTS trg_complaints_updated_at ON public.complaints;
CREATE TRIGGER trg_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Automatically manage resolution timestamps & resolver ID
CREATE OR REPLACE FUNCTION public.handle_complaint_resolution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('resolved', 'dismissed') AND OLD.status NOT IN ('resolved', 'dismissed') THEN
    IF NEW.resolved_at IS NULL THEN
      NEW.resolved_at = now();
    END IF;
    IF NEW.resolved_by IS NULL THEN
      NEW.resolved_by = auth.uid();
    END IF;
  ELSIF NEW.status IN ('pending', 'under_review') THEN
    NEW.resolved_at = NULL;
    NEW.resolved_by = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_complaint_resolution ON public.complaints;
CREATE TRIGGER trg_complaint_resolution
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_complaint_resolution();

-- 6. Notifications Trigger: Notify Admins on Submission & Notify Reporter on Status Change
CREATE OR REPLACE FUNCTION public.handle_complaint_notifications()
RETURNS TRIGGER AS $$
DECLARE
  admin_rec RECORD;
  display_ref TEXT;
  status_msg TEXT;
BEGIN
  display_ref := '#CP-' || upper(substr(NEW.id::text, 1, 8));

  -- On INSERT: Notify all active platform administrators
  IF TG_OP = 'INSERT' THEN
    FOR admin_rec IN 
      SELECT user_id FROM public.admin_users WHERE is_active = true
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_complaint_notifications ON public.complaints;
CREATE TRIGGER trg_complaint_notifications
  AFTER INSERT OR UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_complaint_notifications();

-- 7. Row Level Security Policies
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Admins can view all complaints
DROP POLICY IF EXISTS "Admins can view all complaints" ON public.complaints;
CREATE POLICY "Admins can view all complaints"
  ON public.complaints FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Students can view their own submitted complaints
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.complaints;
CREATE POLICY "Users can view their own complaints"
  ON public.complaints FOR SELECT
  USING (auth.uid() = reporter_id);

-- Students can insert complaints for themselves if not banned and with initial state
DROP POLICY IF EXISTS "Users can submit complaints" ON public.complaints;
CREATE POLICY "Users can submit complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
    AND NOT public.is_banned(auth.uid())
    AND status = 'pending'
    AND priority = 'normal'
    AND admin_notes IS NULL
    AND resolved_by IS NULL
    AND resolved_at IS NULL
  );

-- Admins can update complaints (status, priority, admin_notes)
DROP POLICY IF EXISTS "Admins can update complaints" ON public.complaints;
CREATE POLICY "Admins can update complaints"
  ON public.complaints FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Super Admins can delete complaints if necessary
DROP POLICY IF EXISTS "Super Admins can delete complaints" ON public.complaints;
CREATE POLICY "Super Admins can delete complaints"
  ON public.complaints FOR DELETE
  USING (public.is_super_admin(auth.uid()));
