-- ==============================================================================
-- DevPair Migration: Enforce Ban Checks on All User Write Policies
-- ==============================================================================

-- Drop legacy update policies on public.profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id AND NOT public.is_banned(auth.uid()))
  WITH CHECK (auth.uid() = id AND NOT public.is_banned(auth.uid()));

-- Enforce ban check on public.user_skills mutations
DROP POLICY IF EXISTS "Users can update their own skills" ON public.user_skills;
CREATE POLICY "Users can update their own skills"
  ON public.user_skills FOR UPDATE
  USING (auth.uid() = user_id AND NOT public.is_banned(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Users can remove their own skills" ON public.user_skills;
CREATE POLICY "Users can remove their own skills"
  ON public.user_skills FOR DELETE
  USING (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

-- Enforce ban check on public.projects mutations
DROP POLICY IF EXISTS "Owners can update their own projects" ON public.projects;
CREATE POLICY "Owners can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = owner_id AND NOT public.is_banned(auth.uid()))
  WITH CHECK (auth.uid() = owner_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Owners can delete their own projects" ON public.projects;
CREATE POLICY "Owners can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = owner_id AND NOT public.is_banned(auth.uid()));
