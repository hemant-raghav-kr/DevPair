-- ==============================================================================
-- DevPair Initial Database Schema Migration
-- Designed for PostgreSQL 15+ in Supabase
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER FUNCTIONS & TRIGGERS

-- Automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CORE APPLICATION TABLES

-- ------------------------------------------------------------------------------
-- Table: profiles
-- 1-to-1 extension of auth.users
-- ------------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  college TEXT,
  course TEXT,
  graduation_year INTEGER CHECK (graduation_year >= 2020 AND graduation_year <= 2040),
  availability_hours_per_week INTEGER DEFAULT 10 CHECK (availability_hours_per_week >= 0 AND availability_hours_per_week <= 100),
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT username_format_check CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$')
);

CREATE UNIQUE INDEX idx_profiles_username_lower ON public.profiles (lower(username));
CREATE INDEX idx_profiles_college ON public.profiles (college);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: skills
-- Global skills taxonomy
-- ------------------------------------------------------------------------------
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN (
    'frontend', 'backend', 'fullstack', 'mobile', 'ai_ml',
    'devops_cloud', 'data_science', 'ui_ux_design',
    'product_management', 'blockchain', 'cybersecurity', 'other'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_skills_name_lower ON public.skills (lower(trim(name)));
CREATE INDEX idx_skills_category ON public.skills (category);

-- ------------------------------------------------------------------------------
-- Table: user_skills
-- Junction table mapping profiles to skills with proficiency levels
-- ------------------------------------------------------------------------------
CREATE TABLE public.user_skills (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency TEXT NOT NULL DEFAULT 'intermediate' CHECK (proficiency IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);

CREATE INDEX idx_user_skills_user_id ON public.user_skills (user_id);
CREATE INDEX idx_user_skills_skill_id ON public.user_skills (skill_id);
CREATE INDEX idx_user_skills_proficiency ON public.user_skills (proficiency);

-- ------------------------------------------------------------------------------
-- Table: projects
-- Project & hackathon listings created by users
-- ------------------------------------------------------------------------------
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3 AND char_length(title) <= 120),
  tagline TEXT CHECK (char_length(tagline) <= 200),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 10),
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'recruiting' CHECK (status IN (
    'draft', 'recruiting', 'in_progress', 'completed', 'archived'
  )),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN (
    'public', 'unlisted', 'private'
  )),
  is_hackathon BOOLEAN NOT NULL DEFAULT false,
  hackathon_name TEXT,
  hackathon_deadline TIMESTAMPTZ,
  max_team_size INTEGER NOT NULL DEFAULT 4 CHECK (max_team_size >= 1 AND max_team_size <= 50),
  repo_url TEXT,
  demo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_owner_id ON public.projects (owner_id);
CREATE INDEX idx_projects_status ON public.projects (status);
CREATE INDEX idx_projects_visibility ON public.projects (visibility);
CREATE INDEX idx_projects_category ON public.projects (category);
CREATE INDEX idx_projects_is_hackathon ON public.projects (is_hackathon) WHERE is_hackathon = true;
CREATE INDEX idx_projects_created_at ON public.projects (created_at DESC);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: project_roles
-- Specific roles/positions needed for a project
-- ------------------------------------------------------------------------------
CREATE TABLE public.project_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 2 AND char_length(title) <= 80),
  description TEXT,
  required_skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  slots INTEGER NOT NULL DEFAULT 1 CHECK (slots >= 1 AND slots <= 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_roles_project_id ON public.project_roles (project_id);
CREATE INDEX idx_project_roles_required_skill_id ON public.project_roles (required_skill_id);

-- ------------------------------------------------------------------------------
-- Table: applications
-- Requests from students to join a project
-- ------------------------------------------------------------------------------
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.project_roles(id) ON DELETE SET NULL,
  message TEXT NOT NULL CHECK (char_length(trim(message)) >= 5 AND char_length(message) <= 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'rejected', 'withdrawn'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate active/pending applications from the same applicant to the same role/project
CREATE UNIQUE INDEX idx_applications_unique_pending 
  ON public.applications (project_id, applicant_id, COALESCE(role_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE status = 'pending';

CREATE INDEX idx_applications_project_id ON public.applications (project_id);
CREATE INDEX idx_applications_applicant_id ON public.applications (applicant_id);
CREATE INDEX idx_applications_role_id ON public.applications (role_id);
CREATE INDEX idx_applications_status ON public.applications (status);

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Prevent project owners from applying to their own project
CREATE OR REPLACE FUNCTION public.validate_application_insert()
RETURNS TRIGGER AS $$
DECLARE
  proj_owner_id UUID;
BEGIN
  SELECT owner_id INTO proj_owner_id FROM public.projects WHERE id = NEW.project_id;

  IF proj_owner_id IS NULL THEN
    RAISE EXCEPTION 'Project does not exist';
  END IF;

  IF proj_owner_id = NEW.applicant_id THEN
    RAISE EXCEPTION 'Project owner cannot apply to their own project';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_application_insert
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.validate_application_insert();

-- ------------------------------------------------------------------------------
-- Table: bookmarks
-- Saved/starred projects
-- ------------------------------------------------------------------------------
CREATE TABLE public.bookmarks (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

CREATE INDEX idx_bookmarks_user_id ON public.bookmarks (user_id);
CREATE INDEX idx_bookmarks_project_id ON public.bookmarks (project_id);

-- ------------------------------------------------------------------------------
-- Table: notifications
-- In-app notifications for applications, invitations, and updates
-- ------------------------------------------------------------------------------
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'application_received',
    'application_status_updated',
    'team_invitation',
    'project_update',
    'match_recommendation',
    'general'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  related_application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read, created_at DESC);

-- ------------------------------------------------------------------------------
-- Trigger: Automatic profile creation on auth.users insert
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_username TEXT;
BEGIN
  -- Derive initial username from metadata or email prefix
  default_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Clean non-alphanumeric characters
  default_username := regexp_replace(default_username, '[^a-zA-Z0-9_]', '_', 'g');

  -- Ensure minimum 3 characters
  IF char_length(default_username) < 3 THEN
    default_username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;

  default_username := substr(default_username, 1, 25);

  -- Disambiguate if collision exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(default_username)) THEN
    default_username := default_username || '_' || substr(NEW.id::text, 1, 4);
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url
  ) VALUES (
    NEW.id,
    default_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', default_username),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Profiles Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- Skills Policies (Global Taxonomy)
-- Read: all users; Write: service-role only
-- ------------------------------------------------------------------------------
CREATE POLICY "Skills are viewable by everyone"
  ON public.skills FOR SELECT
  USING (true);

-- ------------------------------------------------------------------------------
-- User Skills Policies
-- Read: all users; Write: profile owner only
-- ------------------------------------------------------------------------------
CREATE POLICY "User skills are viewable by everyone"
  ON public.user_skills FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own skills"
  ON public.user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON public.user_skills FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own skills"
  ON public.user_skills FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Projects Policies
-- Read: public projects or owned; Write: owner only
-- ------------------------------------------------------------------------------
CREATE POLICY "Public or owned projects are viewable"
  ON public.projects FOR SELECT
  USING (visibility = 'public' OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = owner_id);

-- ------------------------------------------------------------------------------
-- Project Roles Policies
-- Read: viewable if project viewable; Write: project owner only
-- ------------------------------------------------------------------------------
CREATE POLICY "Roles are viewable if parent project is viewable"
  ON public.project_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_roles.project_id
        AND (projects.visibility = 'public' OR projects.owner_id = auth.uid())
    )
  );

CREATE POLICY "Owners can create roles for their projects"
  ON public.project_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_roles.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update roles for their projects"
  ON public.project_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_roles.project_id
        AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_roles.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete roles for their projects"
  ON public.project_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_roles.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- Applications Policies
-- Read: applicant or project owner
-- Insert: applicant only (cannot apply to own project)
-- Update: project owner can accept/reject; applicant can only withdraw
-- Delete: applicant only (if pending or withdrawn)
-- ------------------------------------------------------------------------------
CREATE POLICY "Applicants and project owners can view applications"
  ON public.applications FOR SELECT
  USING (
    auth.uid() = applicant_id
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = applications.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Applicants can submit applications"
  ON public.applications FOR INSERT
  WITH CHECK (
    auth.uid() = applicant_id
    AND NOT EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = applications.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update application status"
  ON public.applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = applications.project_id
        AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = applications.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Applicants can withdraw their pending applications"
  ON public.applications FOR UPDATE
  USING (
    auth.uid() = applicant_id
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = applicant_id
    AND status = 'withdrawn'
  );

CREATE POLICY "Applicants can delete their pending or withdrawn applications"
  ON public.applications FOR DELETE
  USING (
    auth.uid() = applicant_id
    AND status IN ('pending', 'withdrawn')
  );

-- ------------------------------------------------------------------------------
-- Bookmarks Policies
-- User-scoped access only
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Notifications Policies
-- User-scoped read/update/delete; Insert reserved for server/triggers
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. REALTIME PUBLICATION
-- ==============================================================================
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
