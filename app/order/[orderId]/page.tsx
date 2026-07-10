import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderTracker } from "@/components/customer/order-tracker";

export const dynamic = "force-dynamic";

export default async function OrderTrackingPage({ params }: { params: { orderId: string } }) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*), tables(label)")
    .eq("id", params.orderId)
    .single();

  const { data: settings } = await supabase.from("restaurant_settings").select("*").eq("id", 1).single();

  if (!order) notFound();

  return <OrderTracker initialOrder={order} currency={settings?.currency ?? "LKR"} />;
}
