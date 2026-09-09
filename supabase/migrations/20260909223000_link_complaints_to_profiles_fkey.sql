-- ==============================================================================
-- DevPair Migration: Add foreign key from complaints to public.profiles
-- Enables PostgREST schema cache to join complaints with student profiles
-- ==============================================================================

ALTER TABLE public.complaints
  DROP CONSTRAINT IF EXISTS complaints_reporter_id_fkey,
  DROP CONSTRAINT IF EXISTS complaints_reported_user_id_fkey;

ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_reporter_id_fkey
    FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT complaints_reported_user_id_fkey
    FOREIGN KEY (reported_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
