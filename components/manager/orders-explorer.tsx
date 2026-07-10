"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, STATUS_CONFIG, timeSince } from "@/lib/utils";
import type { Order, TableRow, OrderStatus } from "@/lib/types";

const STATUS_TABS: ("all" | OrderStatus)[] = ["all", "waiting", "accepted", "preparing", "ready", "served", "cancelled"];

export function OrdersExplorer({ initialOrders, tables }: { initialOrders: Order[]; tables: TableRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    return initialOrders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (tableFilter !== "all" && String(o.table_id) !== tableFilter) return false;
      if (dateFilter && !o.created_at.startsWith(dateFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const matchesOrderNumber = String(o.order_number).includes(s);
        const matchesItem = o.order_items?.some((oi) => oi.item_name.toLowerCase().includes(s));
        if (!matchesOrderNumber && !matchesItem) return false;
      }
      return true;
    });
  }, [initialOrders, statusFilter, tableFilter, dateFilter, search]);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
              statusFilter === s ? "bg-chili text-white border-chili" : "bg-white border-espresso/10 text-ink/60"
            }`}
          >
            {s === "all" ? "All" : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
          <Input
            placeholder="Search order # or item…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="h-10 rounded-lg border border-espresso/15 bg-white px-3 text-sm"
        >
          <option value="all">All Tables</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-10 rounded-lg border border-espresso/15 bg-white px-3 text-sm"
        />
      </div>

      <div className="bg-white rounded-card border border-espresso/5 shadow-ticket overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream/70 text-xs uppercase tracking-wide text-ink/40">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Table</th>
              <th className="text-left px-4 py-3">Items</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-t border-espresso/5">
                <td className="px-4 py-3 font-mono">#{o.order_number}</td>
                <td className="px-4 py-3">{o.tables?.label}</td>
                <td className="px-4 py-3 max-w-xs truncate">
                  {o.order_items?.map((i) => `${i.quantity}× ${i.item_name}`).join(", ")}
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_CONFIG[o.status].badge}>{STATUS_CONFIG[o.status].label}</Badge>
                </td>
                <td className="px-4 py-3 font-mono">{formatCurrency(o.grand_total)}</td>
                <td className="px-4 py-3 text-ink/50">{timeSince(o.created_at)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-ink/40">
                  No orders match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
