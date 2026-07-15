import { createClient } from "@/lib/supabase/server";
import { ManagerShell } from "@/components/manager/manager-shell";
import { LiveOrdersBoard } from "@/components/manager/live-orders-board";

export const dynamic = "force-dynamic";

export default async function ManagerLivePage() {
  const supabase = createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*), tables(label)")
    .in("status", ["waiting", "accepted", "preparing", "ready", "served"])
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <ManagerShell>
      <div className="p-8">
        <h1 className="font-display text-2xl font-semibold">Live Orders</h1>
        <p className="text-sm text-ink/50 mt-1">
          Approve new orders, keep an eye on the kitchen, and settle bills.
        </p>
        <LiveOrdersBoard initialOrders={orders ?? []} />
      </div>
    </ManagerShell>
  );
}
