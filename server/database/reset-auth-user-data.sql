-- Reset auth + user account data for fresh admin setup.
-- Run in Supabase SQL Editor, then open http://localhost:3000/admin-setup

-- Auth schema (login accounts, sessions)
TRUNCATE TABLE hashibasha_auth.refresh_tokens CASCADE;
TRUNCATE TABLE hashibasha_auth.sessions CASCADE;
TRUNCATE TABLE hashibasha_auth.users CASCADE;

-- User schema (profiles and memberships — keeps roles/features/designations seed data)
TRUNCATE TABLE hashibasha_user.team_members CASCADE;
TRUNCATE TABLE hashibasha_user.user_teams CASCADE;
TRUNCATE TABLE hashibasha_user.user_tags CASCADE;
TRUNCATE TABLE hashibasha_user.user_designations CASCADE;
TRUNCATE TABLE hashibasha_user.org_memberships CASCADE;
TRUNCATE TABLE hashibasha_user.user_profiles CASCADE;

-- Optional tables if they exist from prior imports
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hashibasha_user' AND table_name = 'removed_users') THEN
    EXECUTE 'TRUNCATE TABLE hashibasha_user.removed_users CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hashibasha_user' AND table_name = 'assignee_profile_users') THEN
    EXECUTE 'TRUNCATE TABLE hashibasha_user.assignee_profile_users CASCADE';
  END IF;
END $$;
