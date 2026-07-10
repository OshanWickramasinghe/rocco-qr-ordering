import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { orderId, tableId, rating, comment } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.from("reviews").insert({
    order_id: orderId || null,
    table_id: tableId || null,
    rating,
    comment: comment || null,
  });

  if (error) {
    return NextResponse.json({ error: "Could not submit your review." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
