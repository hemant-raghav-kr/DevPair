-- ==============================================================================
-- DevPair Migration: Create admin_users table and secure authorization functions
-- ==============================================================================

-- 1. Table: public.admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users (user_id) WHERE is_active = true;

-- 3. Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Helper function: is_admin
-- Evaluates whether a user is an active admin without causing RLS recursion
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

-- 5. RLS Policies on public.admin_users
-- Admins can view other admin records; regular users cannot read any records
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
  ON public.admin_users FOR SELECT
  USING (public.is_admin(auth.uid()));

-- No INSERT/UPDATE/DELETE policies for public or authenticated roles.
-- Admin user records must be provisioned via service-role / migrations / superuser.
