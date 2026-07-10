-- ============================================================================
-- Run this AFTER you create staff logins in Supabase Authentication.
-- Steps:
--   1. Supabase Dashboard -> Authentication -> Users -> Add user
--      (create one user for the manager, one for each chef, with email + password)
--   2. Copy each user's UUID from the Users table
--   3. Replace the placeholders below and run in SQL Editor
-- ============================================================================

-- Manager account
insert into public.profiles (id, full_name, role)
values ('PASTE-MANAGER-AUTH-USER-UUID-HERE', 'Restaurant Manager', 'manager')
on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;

-- Chef account (repeat this block for each chef)
insert into public.profiles (id, full_name, role)
values ('PASTE-CHEF-AUTH-USER-UUID-HERE', 'Head Chef', 'chef')
on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;
