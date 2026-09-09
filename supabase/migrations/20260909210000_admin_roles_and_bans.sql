-- ==============================================================================
-- DevPair Migration: Admin Roles (super_admin / admin), Canonical Protection & Ban System
-- ==============================================================================

-- 1. Extend public.admin_users with role column
ALTER TABLE public.admin_users 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin' 
  CHECK (role IN ('super_admin', 'admin'));

-- 2. Create public.user_bans table
CREATE TABLE IF NOT EXISTS public.user_bans (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  banned BOOLEAN NOT NULL DEFAULT true,
  banned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ban_reason TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_bans_banned ON public.user_bans (user_id) WHERE banned = true;

-- Enable RLS on public.user_bans
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Helper function: is_banned
CREATE OR REPLACE FUNCTION public.is_banned(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_bans
    WHERE user_id = check_user_id AND banned = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Helper function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = check_user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Helper function: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = check_user_id AND is_active = true AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. RLS Policies on public.user_bans
DROP POLICY IF EXISTS "Admins and owners can view bans" ON public.user_bans;
CREATE POLICY "Admins and owners can view bans"
  ON public.user_bans FOR SELECT
  USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);

-- 4. Protect Canonical Super Admin at Database Trigger Level
-- Canonical Super Admin UUID for hk9981@srmist.edu.in
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_super_admin ON public.admin_users;
CREATE TRIGGER trg_protect_super_admin
  BEFORE UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_canonical_super_admin();

-- 5. Seed / Provision Canonical Super Admin: hk9981@srmist.edu.in
INSERT INTO public.admin_users (user_id, role, is_active)
VALUES ('02635888-ded4-4108-9fed-16fd43c7a3e5'::uuid, 'super_admin', true)
ON CONFLICT (user_id) DO UPDATE
SET role = 'super_admin', is_active = true;

-- Ensure profile username is hk9981
UPDATE public.profiles
SET username = 'hk9981'
WHERE id = '02635888-ded4-4108-9fed-16fd43c7a3e5'::uuid;

-- 6. Enforce Banned Status across Core RLS Write Policies
-- Projects INSERT
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND NOT public.is_banned(auth.uid()));

-- Applications INSERT
DROP POLICY IF EXISTS "Applicants can submit applications" ON public.applications;
CREATE POLICY "Applicants can submit applications"
  ON public.applications FOR INSERT
  WITH CHECK (
    auth.uid() = applicant_id
    AND NOT public.is_banned(auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = applications.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Profiles UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id AND NOT public.is_banned(auth.uid()))
  WITH CHECK (auth.uid() = id AND NOT public.is_banned(auth.uid()));

-- User Skills INSERT
DROP POLICY IF EXISTS "Users can add their own skills" ON public.user_skills;
CREATE POLICY "Users can add their own skills"
  ON public.user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));
