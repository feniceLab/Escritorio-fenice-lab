-- ============================================================
-- STARKEN OS - AUTH MIGRATION: PIN -> PASSWORD (bcrypt)
-- ============================================================
-- This migration converts authentication from plain-text PIN
-- to bcrypt-hashed passwords using the pgcrypto extension.
--
-- Run this in Supabase SQL Editor.
-- ============================================================


-- ============================================================
-- 1. ENABLE PGCRYPTO EXTENSION
-- ============================================================
-- pgcrypto provides crypt() and gen_salt() for bcrypt hashing.

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- 2. ADD password_hash COLUMN TO users TABLE
-- ============================================================
-- New column to store bcrypt hashes. Replaces the old pin_hash.

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;


-- ============================================================
-- 3. SET BCRYPT PASSWORDS FOR EXISTING USERS
-- ============================================================
-- Each user gets a secure bcrypt-hashed password.
-- crypt() with gen_salt('bf') produces a Blowfish (bcrypt) hash.

UPDATE users
SET password_hash = crypt('Starken2026@#-', gen_salt('bf'))
WHERE LOWER(name) = 'juan';

UPDATE users
SET password_hash = crypt('Starken2026@#!98', gen_salt('bf'))
WHERE LOWER(name) = 'henrique';

UPDATE users
SET password_hash = crypt('Starken2026@#!10', gen_salt('bf'))
WHERE LOWER(name) = 'emilly';


-- ============================================================
-- 4. (OPTIONAL) DROP OLD pin_hash COLUMN
-- ============================================================
-- Uncomment the line below once you have confirmed the new
-- password-based login is working correctly in production.

-- ALTER TABLE users DROP COLUMN IF EXISTS pin_hash;


-- ============================================================
-- 5. CREATE verify_login RPC FUNCTION
-- ============================================================
-- This function is called from the frontend via supabase.rpc().
-- It looks up a user by name (case-insensitive), verifies the
-- password against the stored bcrypt hash, and returns user
-- data as JSON on success or NULL on failure.
--
-- SECURITY DEFINER: runs with the privileges of the function
-- owner (postgres), bypassing RLS so anon can call it without
-- needing direct SELECT access to the users table.

CREATE OR REPLACE FUNCTION verify_login(p_name TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Look up user by name (case-insensitive), must be active
  SELECT id, name, role, avatar_color, password_hash
  INTO v_user
  FROM users
  WHERE LOWER(name) = LOWER(p_name)
    AND active = true
  LIMIT 1;

  -- If no user found, return null
  IF v_user IS NULL THEN
    RETURN NULL;
  END IF;

  -- Verify password: crypt(input, stored_hash) must equal stored_hash
  IF crypt(p_password, v_user.password_hash) = v_user.password_hash THEN
    -- Password matches, return user data as JSON
    RETURN json_build_object(
      'id',           v_user.id,
      'name',         v_user.name,
      'role',         v_user.role,
      'avatar_color', v_user.avatar_color
    );
  ELSE
    -- Password does not match
    RETURN NULL;
  END IF;
END;
$$;


-- ============================================================
-- 6. GRANT EXECUTE TO anon AND authenticated ROLES
-- ============================================================
-- anon needs access so unauthenticated users can log in.
-- authenticated is granted for completeness.

GRANT EXECUTE ON FUNCTION verify_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_login(TEXT, TEXT) TO authenticated;


-- ============================================================
-- 7. RLS: DENY DIRECT SELECT ON users FOR anon
-- ============================================================
-- Enable RLS on users table (if not already enabled) and add
-- a policy that blocks anon from reading the table directly.
-- This forces all login attempts through the verify_login RPC,
-- which runs as SECURITY DEFINER and bypasses RLS internally.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all users (for UI display)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'authenticated_read_users'
  ) THEN
    CREATE POLICY authenticated_read_users ON users
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END;
$$;

-- Explicitly deny anon from selecting users directly.
-- Since RLS is enabled and there is no policy granting anon
-- SELECT access, anon is already denied by default. This
-- comment clarifies the intent: anon must use verify_login().


-- ============================================================
-- DONE
-- ============================================================
-- After running this migration:
--   1. Update frontend to call supabase.rpc('verify_login', { p_name, p_password })
--   2. Replace PIN input with a password input field
--   3. Test all 3 users can log in with their new passwords
--   4. Once confirmed, uncomment the DROP COLUMN in section 4
