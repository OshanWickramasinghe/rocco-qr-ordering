import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const supabase = createClient();

  // Customer actions (no login) go through narrow, safe RPC functions that
  // can ONLY flip these two flags — never price, status, or anything else.
  if (typeof body.waiter_called === "boolean" && body.waiter_called) {
    const { error } = await supabase.rpc("call_waiter", { p_order_id: params.id });
    if (error) return NextResponse.json({ error: "Could not notify the waiter." }, { status: 500 });
  }
  if (typeof body.bill_requested === "boolean" && body.bill_requested) {
    const { error } = await supabase.rpc("request_bill", { p_order_id: params.id });
    if (error) return NextResponse.json({ error: "Could not request the bill." }, { status: 500 });
  }

  // Staff actions (chef/manager, logged in) go through the normal update,
  // which is protected by the "orders_staff_update" database rule.
  const statusUpdates: Record<string, unknown> = {};
  if (body.status) {
    const status = body.status as OrderStatus;
    statusUpdates.status = status;
    if (status === "accepted") statusUpdates.accepted_at = new Date().toISOString();
    if (status === "ready") statusUpdates.ready_at = new Date().toISOString();
    if (status === "served") statusUpdates.served_at = new Date().toISOString();
    if (status === "cancelled") statusUpdates.cancelled_at = new Date().toISOString();
  }

  if (Object.keys(statusUpdates).length === 0) {
    // Nothing left to do (this was a waiter/bill-only request) — return the
    // current order so the caller has something to work with.
    const { data } = await supabase.from("orders").select("*").eq("id", params.id).single();
    return NextResponse.json({ order: data });
  }

  const { data, error } = await supabase
    .from("orders")
    .update(statusUpdates)
    .eq("id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}
