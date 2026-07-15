-- ============================================================================
-- Adds support for the Manager Live Orders workflow:
--   - Manager approves new orders before the kitchen sees them
--   - Manager can mark a table's bill as paid once served
--
-- Run this once in Supabase -> SQL Editor -> New query -> Run.
-- Safe to run on top of everything you've already set up — it only adds two
-- new columns, it doesn't touch your existing tables or data.
-- ============================================================================

alter table public.orders add column if not exists bill_settled boolean not null default false;
alter table public.orders add column if not exists settled_at timestamptz;
