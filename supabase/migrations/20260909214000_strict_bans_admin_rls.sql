-- ==============================================================================
-- DevPair Migration: Restrict public.user_bans strictly to Admins
-- ==============================================================================

DROP POLICY IF EXISTS "Admins and owners can view bans" ON public.user_bans;
DROP POLICY IF EXISTS "Admins can view bans" ON public.user_bans;
DROP POLICY IF EXISTS "Admins can insert bans" ON public.user_bans;
DROP POLICY IF EXISTS "Admins can update bans" ON public.user_bans;
DROP POLICY IF EXISTS "Admins can delete bans" ON public.user_bans;

CREATE POLICY "Admins can view bans"
  ON public.user_bans FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert bans"
  ON public.user_bans FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update bans"
  ON public.user_bans FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete bans"
  ON public.user_bans FOR DELETE
  USING (public.is_admin(auth.uid()));
