-- ============================================================================
-- Fix: place orders atomically so an order is never visible to the kitchen
-- display before its items have been saved.
-- Run this in Supabase SQL Editor (safe to run even if you've already run
-- schema.sql — this just adds one new function).
-- ============================================================================

create or replace function public.place_order(
  p_table_id int,
  p_items jsonb,            -- array of {menu_item_id, item_name, unit_price, quantity, notes, line_total}
  p_subtotal numeric,
  p_vat_amount numeric,
  p_service_charge numeric,
  p_grand_total numeric
)
returns public.orders
language plpgsql
as $$
declare
  new_order public.orders;
begin
  insert into public.orders (table_id, subtotal, vat_amount, service_charge, grand_total)
  values (p_table_id, p_subtotal, p_vat_amount, p_service_charge, p_grand_total)
  returning * into new_order;

  insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, notes, line_total)
  select
    new_order.id,
    (i->>'menu_item_id')::uuid,
    i->>'item_name',
    (i->>'unit_price')::numeric,
    (i->>'quantity')::int,
    i->>'notes',
    (i->>'line_total')::numeric
  from jsonb_array_elements(p_items) as i;

  return new_order;
end;
$$;

grant execute on function public.place_order(int, jsonb, numeric, numeric, numeric, numeric) to anon, authenticated;
