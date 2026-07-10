import { createClient } from "@/lib/supabase/server";
import { ManagerShell } from "@/components/manager/manager-shell";
import { ReportsDashboard } from "@/components/manager/reports-dashboard";

export const dynamic = "force-dynamic";

export default async function ManagerReportsPage() {
  const supabase = createClient();

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [{ data: orders }, { data: orderItems }, { data: reviews }] = await Promise.all([
    supabase
      .from("orders")
      .select("grand_total, status, created_at, table_id, tables(label)")
      .gte("created_at", fourteenDaysAgo.toISOString()),
    supabase
      .from("order_items")
      .select("item_name, quantity, line_total, menu_items(prep_time_minutes, categories(name))")
      .gte("created_at", fourteenDaysAgo.toISOString()),
    supabase.from("reviews").select("rating"),
  ]);

  const nonCancelled = (orders ?? []).filter((o) => o.status !== "cancelled");

  // Daily sales (last 14 days)
  const dailyMap: Record<string, number> = {};
  for (const o of nonCancelled) {
    const day = o.created_at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] ?? 0) + Number(o.grand_total);
  }
  const dailySales = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));

  // Peak ordering hours
  const hourMap: Record<number, number> = {};
  for (const o of nonCancelled) {
    const hour = new Date(o.created_at).getHours();
    hourMap[hour] = (hourMap[hour] ?? 0) + 1;
  }
  const hourlyOrders = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, orders: hourMap[h] ?? 0 }));

  // Revenue & quantity by category, best/worst pizza
  const categoryRevenue: Record<string, number> = {};
  const itemQty: Record<string, number> = {};
  const prepTimes: number[] = [];
  for (const oi of orderItems ?? []) {
    const catName = (oi as any).menu_items?.categories?.name ?? "Other";
    categoryRevenue[catName] = (categoryRevenue[catName] ?? 0) + Number(oi.line_total);
    itemQty[oi.item_name] = (itemQty[oi.item_name] ?? 0) + oi.quantity;
    if ((oi as any).menu_items?.prep_time_minutes) prepTimes.push((oi as any).menu_items.prep_time_minutes);
  }
  const revenueByCategory = Object.entries(categoryRevenue).map(([name, value]) => ({ name, value }));
  const sortedItems = Object.entries(itemQty).sort((a, b) => b[1] - a[1]);
  const bestSelling = sortedItems.slice(0, 5).map(([name, qty]) => ({ name, qty }));
  const worstSelling = sortedItems.slice(-5).reverse().map(([name, qty]) => ({ name, qty }));
  const avgPrepTime = prepTimes.length ? prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length : 0;

  // Top tables by spend (proxy for "top customers" since no customer identity exists)
  const tableSpend: Record<string, number> = {};
  for (const o of nonCancelled) {
    const label = (o as any).tables?.label ?? `Table ${o.table_id}`;
    tableSpend[label] = (tableSpend[label] ?? 0) + Number(o.grand_total);
  }
  const topTables = Object.entries(tableSpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, total]) => ({ label, total }));

  const avgRating = reviews && reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const totalRevenue = nonCancelled.reduce((s, o) => s + Number(o.grand_total), 0);

  return (
    <ManagerShell>
      <div className="p-8">
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-ink/50 mt-1">Last 14 days of activity. Export as CSV or PDF for meetings.</p>
        <ReportsDashboard
          dailySales={dailySales}
          hourlyOrders={hourlyOrders}
          revenueByCategory={revenueByCategory}
          bestSelling={bestSelling}
          worstSelling={worstSelling}
          topTables={topTables}
          avgPrepTime={avgPrepTime}
          avgRating={avgRating}
          totalRevenue={totalRevenue}
        />
      </div>
    </ManagerShell>
  );
}
