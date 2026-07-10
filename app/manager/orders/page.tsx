import { createClient } from "@/lib/supabase/server";
import { ManagerShell } from "@/components/manager/manager-shell";
import { OrdersExplorer } from "@/components/manager/orders-explorer";

export const dynamic = "force-dynamic";

export default async function ManagerOrdersPage() {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*), tables(label)")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: tables } = await supabase.from("tables").select("*").order("id");

  return (
    <ManagerShell>
      <div className="p-8">
        <h1 className="font-display text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-ink/50 mt-1">Search, filter, and review every order.</p>
        <OrdersExplorer initialOrders={orders ?? []} tables={tables ?? []} />
      </div>
    </ManagerShell>
  );
}
