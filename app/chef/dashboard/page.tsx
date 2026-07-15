import { createClient } from "@/lib/supabase/server";
import { KitchenBoard } from "@/components/chef/kitchen-board";

export const dynamic = "force-dynamic";

export default async function ChefDashboardPage() {
  const supabase = createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*), tables(label)")
    .in("status", ["accepted", "preparing", "ready"])
    .order("created_at", { ascending: false });

  return <KitchenBoard initialOrders={orders ?? []} />;
}
