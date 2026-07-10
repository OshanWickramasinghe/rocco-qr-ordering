import { createClient } from "@/lib/supabase/server";
import { ManagerShell } from "@/components/manager/manager-shell";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, ShoppingBag, Clock3, Receipt, Star, Pizza, GlassWater } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage() {
  const supabase = createClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data: settings } = await supabase.from("restaurant_settings").select("*").eq("id", 1).single();
  const currency = settings?.currency ?? "LKR";

  const { data: todaysOrders } = await supabase
    .from("orders")
    .select("grand_total, status, created_at")
    .gte("created_at", startOfToday.toISOString())
    .neq("status", "cancelled");

  const { count: pendingCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["waiting", "accepted", "preparing"]);

  const { data: reviews } = await supabase.from("reviews").select("rating");

  const { data: itemStats } = await supabase
    .from("order_items")
    .select("item_name, quantity, menu_items(category_id, categories(name))");

  const todaysSales = (todaysOrders ?? []).reduce((s, o) => s + Number(o.grand_total), 0);
  const orderCount = todaysOrders?.length ?? 0;
  const avgOrderValue = orderCount > 0 ? todaysSales / orderCount : 0;
  const avgRating = reviews && reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const pizzaCounts: Record<string, number> = {};
  const drinkCounts: Record<string, number> = {};
  for (const row of itemStats ?? []) {
    const catName = (row as any).menu_items?.categories?.name as string | undefined;
    if (catName?.includes("Pizza")) {
      pizzaCounts[row.item_name] = (pizzaCounts[row.item_name] ?? 0) + row.quantity;
    }
    if (catName === "Drinks") {
      drinkCounts[row.item_name] = (drinkCounts[row.item_name] ?? 0) + row.quantity;
    }
  }
  const topPizza = Object.entries(pizzaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const topDrink = Object.entries(drinkCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const cards = [
    { label: "Today's Sales", value: formatCurrency(todaysSales, currency), icon: TrendingUp, color: "text-basil" },
    { label: "Orders Today", value: String(orderCount), icon: ShoppingBag, color: "text-chili" },
    { label: "Pending Orders", value: String(pendingCount ?? 0), icon: Clock3, color: "text-gold-dark" },
    { label: "Avg Order Value", value: formatCurrency(avgOrderValue, currency), icon: Receipt, color: "text-espresso" },
    { label: "Top Selling Pizza", value: topPizza, icon: Pizza, color: "text-chili" },
    { label: "Most Ordered Drink", value: topDrink, icon: GlassWater, color: "text-basil" },
    { label: "Customer Rating", value: avgRating ? `${avgRating.toFixed(1)} / 5` : "—", icon: Star, color: "text-gold-dark" },
  ];

  return (
    <ManagerShell>
      <div className="p-8">
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-ink/50 mt-1">A live snapshot of how the restaurant is doing today.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-card border border-espresso/5 shadow-ticket p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">{card.label}</span>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <p className="font-display text-2xl font-semibold mt-2 truncate">{card.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </ManagerShell>
  );
}
