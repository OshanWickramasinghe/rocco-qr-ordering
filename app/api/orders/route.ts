import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface IncomingLine {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { tableId, lines } = body as { tableId: number; lines: IncomingLine[] };

  if (!tableId || !Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "Table and at least one item are required." }, { status: 400 });
  }

  const supabase = createClient();

  const ids = lines.map((l) => l.menuItemId);
  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id, name, price, is_available")
    .in("id", ids);

  if (menuError || !menuItems) {
    return NextResponse.json({ error: "Could not verify menu items." }, { status: 500 });
  }

  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("vat_rate, service_charge_rate")
    .eq("id", 1)
    .single();

  const vatRate = settings?.vat_rate ?? 0;
  const serviceRate = settings?.service_charge_rate ?? 0;

  let subtotal = 0;
  const orderItemsPayload: {
    menu_item_id: string;
    item_name: string;
    unit_price: number;
    quantity: number;
    notes: string | null;
    line_total: number;
  }[] = [];

  for (const line of lines) {
    const item = menuItems.find((m) => m.id === line.menuItemId);
    if (!item || !item.is_available) continue;
    const lineTotal = Number(item.price) * line.quantity;
    subtotal += lineTotal;
    orderItemsPayload.push({
      menu_item_id: item.id,
      item_name: item.name,
      unit_price: Number(item.price),
      quantity: line.quantity,
      notes: line.notes || null,
      line_total: lineTotal,
    });
  }

  if (orderItemsPayload.length === 0) {
    return NextResponse.json({ error: "None of the items in your cart are currently available." }, { status: 400 });
  }

  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const serviceCharge = Math.round(subtotal * (serviceRate / 100) * 100) / 100;
  const grandTotal = subtotal + vatAmount + serviceCharge;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      table_id: tableId,
      subtotal,
      vat_amount: vatAmount,
      service_charge: serviceCharge,
      grand_total: grandTotal,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Could not place your order. Please try again." }, { status: 500 });
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsPayload.map((i) => ({ ...i, order_id: order.id })));

  if (itemsError) {
    return NextResponse.json({ error: "Order saved but items failed to attach." }, { status: 500 });
  }

  return NextResponse.json({ order });
}
