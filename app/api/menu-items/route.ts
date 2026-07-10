import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      category_id: body.category_id,
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      image_url: body.image_url ?? null,
      prep_time_minutes: body.prep_time_minutes ?? 15,
      is_available: body.is_available ?? true,
      is_spicy: body.is_spicy ?? false,
      is_popular: body.is_popular ?? false,
      is_new: body.is_new ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}
