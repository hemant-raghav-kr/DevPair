-- ==============================================================================
-- DevPair Migration: Restriction Revocation Requests & Extended Audit Events
-- ==============================================================================

-- 1. Create restriction_revoke_requests table
CREATE TABLE IF NOT EXISTS public.restriction_revoke_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('ban', 'cooldown')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT NOT NULL,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index to ensure only one active pending request per user per restriction type
CREATE UNIQUE INDEX IF NOT EXISTS idx_restriction_revoke_requests_pending_unique 
  ON public.restriction_revoke_requests (user_id, restriction_type) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_restriction_revoke_requests_user_id 
  ON public.restriction_revoke_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_restriction_revoke_requests_status 
  ON public.restriction_revoke_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_restriction_revoke_requests_type 
  ON public.restriction_revoke_requests (restriction_type);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_restriction_revoke_requests_updated_at ON public.restriction_revoke_requests;
CREATE TRIGGER trg_restriction_revoke_requests_updated_at
  BEFORE UPDATE ON public.restriction_revoke_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.restriction_revoke_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own revocation requests" ON public.restriction_revoke_requests;
CREATE POLICY "Users can view own revocation requests"
  ON public.restriction_revoke_requests FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all revocation requests" ON public.restriction_revoke_requests;
CREATE POLICY "Admins can view all revocation requests"
  ON public.restriction_revoke_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can insert own pending revocation requests" ON public.restriction_revoke_requests;
CREATE POLICY "Users can insert own pending revocation requests"
  ON public.restriction_revoke_requests FOR INSERT
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Admins can update revocation requests" ON public.restriction_revoke_requests;
CREATE POLICY "Admins can update revocation requests"
  ON public.restriction_revoke_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

-- 2. Extend audit_logs event_type check constraint
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_event_type_check;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_event_type_check
  CHECK (event_type IN (
    'application_withdrawn',
    'withdrawal_cooldown_created',
    'team_member_removed',
    'withdrawal_cooldown_revoked',
    'ban_revocation_requested',
    'ban_revocation_approved',
    'ban_revocation_rejected',
    'cooldown_revocation_requested',
    'cooldown_revocation_approved',
    'cooldown_revocation_rejected'
  ));
