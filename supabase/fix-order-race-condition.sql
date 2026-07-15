-- ============================================================================
-- FIX: Orders sometimes appeared on the Kitchen Display with no items.
--
-- Cause: the app previously (1) inserted the order, then (2) inserted its
-- items as a second, separate step. Supabase Realtime notifies the Kitchen
-- Display the instant step 1 finishes — which can be before step 2 has
-- completed — so the kitchen sometimes fetched an order before its items
-- existed yet, and never checked again.
--
-- Fix: do both steps inside ONE database transaction (this function).
-- Realtime only notifies after the *entire* transaction commits, so by the
-- time the Kitchen Display sees a new order, its items are guaranteed to
-- already be saved.
--
-- Run this once in Supabase -> SQL Editor -> New query -> Run.
-- Safe to run even if you've already run schema.sql — this only adds one
-- new function, it doesn't touch your existing tables or data.
-- ============================================================================

create or replace function public.create_order_with_items(
  p_table_id int,
  p_items jsonb  -- array of {"menu_item_id": "...", "quantity": 2, "notes": "..."}
)
returns public.orders
language plpgsql
security definer
as $$
declare
  v_vat_rate numeric;
  v_service_rate numeric;
  v_subtotal numeric(10,2) := 0;
  v_vat numeric(10,2);
  v_service numeric(10,2);
  v_order public.orders;
  v_item jsonb;
  v_menu_item record;
  v_line_total numeric(10,2);
begin
  select vat_rate, service_charge_rate into v_vat_rate, v_service_rate
  from public.restaurant_settings where id = 1;

  -- Pass 1: validate items and compute the subtotal
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select price, name, is_available into v_menu_item
    from public.menu_items
    where id = (v_item->>'menu_item_id')::uuid;

    if v_menu_item is null or not v_menu_item.is_available then
      continue; -- skip items that don't exist or went unavailable
    end if;

    v_subtotal := v_subtotal + (v_menu_item.price * (v_item->>'quantity')::int);
  end loop;

  if v_subtotal <= 0 then
    raise exception 'No valid items were in the order';
  end if;

  v_vat := round(v_subtotal * (coalesce(v_vat_rate, 0) / 100), 2);
  v_service := round(v_subtotal * (coalesce(v_service_rate, 0) / 100), 2);

  -- Create the order
  insert into public.orders (table_id, subtotal, vat_amount, service_charge, grand_total)
  values (p_table_id, v_subtotal, v_vat, v_service, v_subtotal + v_vat + v_service)
  returning * into v_order;

  -- Pass 2: insert each item against that same order, in the same transaction
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select price, name, is_available into v_menu_item
    from public.menu_items
    where id = (v_item->>'menu_item_id')::uuid;

    if v_menu_item is null or not v_menu_item.is_available then
      continue;
    end if;

    v_line_total := v_menu_item.price * (v_item->>'quantity')::int;

    insert into public.order_items
      (order_id, menu_item_id, item_name, unit_price, quantity, notes, line_total)
    values (
      v_order.id,
      (v_item->>'menu_item_id')::uuid,
      v_menu_item.name,
      v_menu_item.price,
      (v_item->>'quantity')::int,
      v_item->>'notes',
      v_line_total
    );
  end loop;

  return v_order;
end;
$$;

grant execute on function public.create_order_with_items(int, jsonb) to anon, authenticated;
