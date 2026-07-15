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

  // This calls a single database function that creates the order AND all of
  // its items together, in one all-or-nothing transaction. That guarantees
  // the Kitchen Display never sees an order before its items are attached.
  const { data, error } = await supabase.rpc("create_order_with_items", {
    p_table_id: tableId,
    p_items: lines.map((l) => ({
      menu_item_id: l.menuItemId,
      quantity: l.quantity,
      notes: l.notes || null,
    })),
  });

  if (error) {
    const message = error.message.includes("No valid items")
      ? "None of the items in your cart are currently available."
      : "Could not place your order. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ order: data });
}
