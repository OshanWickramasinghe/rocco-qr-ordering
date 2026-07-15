-- ============================================================================
-- FIX: "Call Waiter" and "Request Bill" buttons appeared to work for the
-- customer, but never actually reached the Kitchen Display.
--
-- Cause: the database rule "orders_staff_update" only allows logged-in chef/
-- manager accounts to update an order. Customers are never logged in (by
-- design), so their attempt to flip waiter_called / bill_requested was
-- silently blocked — the app just didn't check for that failure.
--
-- Fix: two narrow functions that let anyone flip ONLY those two flags,
-- without opening up the ability to change price, status, or anything else
-- on the order.
--
-- Run this once in Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

create or replace function public.call_waiter(p_order_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.orders set waiter_called = true where id = p_order_id;
end;
$$;

create or replace function public.request_bill(p_order_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.orders set bill_requested = true where id = p_order_id;
end;
$$;

grant execute on function public.call_waiter(uuid) to anon, authenticated;
grant execute on function public.request_bill(uuid) to anon, authenticated;
