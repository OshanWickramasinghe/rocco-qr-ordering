-- ============================================================================
-- FIX: Atomic order placement
-- Run this in Supabase SQL Editor. It's safe to run even if you already ran
-- schema.sql — this just adds one new function on top of your existing setup.
--
-- Why this is needed: previously the website created an order, then attached
-- its items in a second, separate step. The Kitchen Display listens for new
-- orders in real time and would sometimes grab the order in between those two
-- steps, showing an order with no items that never got updated.
--
-- This function does both steps as a single all-or-nothing database action,
-- so the Kitchen Display never sees a half-created order.
-- ============================================================================

create or replace function public.place_order(p_table_id int, p_items jsonb)
returns uuid
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_subtotal numeric := 0;
  v_vat_rate numeric;
  v_service_rate numeric;
  v_vat_amount numeric;
  v_service_charge numeric;
  v_grand_total numeric;
  v_item jsonb;
  v_menu_item record;
  v_line_total numeric;
begin
  select vat_rate, service_charge_rate into v_vat_rate, v_service_rate
  from public.restaurant_settings where id = 1;

  insert into public.orders (table_id, subtotal, vat_amount, service_charge, grand_total)
  values (p_table_id, 0, 0, 0, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, name, price, is_available into v_menu_item
    from public.menu_items
    where id = (v_item->>'menu_item_id')::uuid;

    if v_menu_item.id is null or not v_menu_item.is_available then
      continue;
    end if;

    v_line_total := v_menu_item.price * (v_item->>'quantity')::int;
    v_subtotal := v_subtotal + v_line_total;

    insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, notes, line_total)
    values (
      v_order_id,
      v_menu_item.id,
      v_menu_item.name,
      v_menu_item.price,
      (v_item->>'quantity')::int,
      v_item->>'notes',
      v_line_total
    );
  end loop;

  if v_subtotal = 0 then
    delete from public.orders where id = v_order_id;
    raise exception 'None of the items in this order are currently available.';
  end if;

  v_vat_amount := round(v_subtotal * (v_vat_rate / 100), 2);
  v_service_charge := round(v_subtotal * (v_service_rate / 100), 2);
  v_grand_total := v_subtotal + v_vat_amount + v_service_charge;

  update public.orders
  set subtotal = v_subtotal,
      vat_amount = v_vat_amount,
      service_charge = v_service_charge,
      grand_total = v_grand_total
  where id = v_order_id;

  return v_order_id;
end;
$$;

grant execute on function public.place_order(int, jsonb) to anon, authenticated;
