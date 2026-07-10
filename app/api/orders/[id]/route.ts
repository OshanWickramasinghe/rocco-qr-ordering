import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const supabase = createClient();

  const updates: Record<string, unknown> = {};

  if (body.status) {
    const status = body.status as OrderStatus;
    updates.status = status;
    if (status === "accepted") updates.accepted_at = new Date().toISOString();
    if (status === "ready") updates.ready_at = new Date().toISOString();
    if (status === "served") updates.served_at = new Date().toISOString();
    if (status === "cancelled") updates.cancelled_at = new Date().toISOString();
  }
  if (typeof body.waiter_called === "boolean") updates.waiter_called = body.waiter_called;
  if (typeof body.bill_requested === "boolean") updates.bill_requested = body.bill_requested;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}
