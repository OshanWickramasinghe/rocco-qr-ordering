"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Receipt, Clock, CheckCircle2, XCircle, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, STATUS_CONFIG, timeSince } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

const VISIBLE_STATUSES: OrderStatus[] = ["waiting", "accepted", "preparing", "ready", "served"];

function playAlertChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Autoplay can be blocked by the browser — fail silently.
  }
}

export function LiveOrdersBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  useEffect(() => {
    const supabase = createClient();

    async function fetchFull(orderId: string) {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*), tables(label)")
        .eq("id", orderId)
        .single();
      return data as Order | null;
    }

    const channel = supabase
      .channel("manager-live-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, async (payload) => {
        const newOrder = payload.new as Order;
        const fullOrder = await fetchFull(newOrder.id);
        if (fullOrder) {
          setOrders((prev) => (prev.some((o) => o.id === fullOrder.id) ? prev : [fullOrder, ...prev]));
          playAlertChime();
          toast.info(`New order to approve — ${fullOrder.tables?.label ?? "Table"} #${fullOrder.order_number}`);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, async (payload) => {
        const updated = payload.new as Order;
        const before = ordersRef.current.find((o) => o.id === updated.id);

        if (!VISIBLE_STATUSES.includes(updated.status)) {
          setOrders((prev) => prev.filter((o) => o.id !== updated.id));
          return;
        }

        // Alert the manager the moment a customer calls the waiter or asks for the bill.
        if (updated.waiter_called && !before?.waiter_called) {
          playAlertChime();
          toast.warning(`${before?.tables?.label ?? "A table"} is calling the waiter`, {
            description: `Order #${updated.order_number}`,
          });
        }
        if (updated.bill_requested && !before?.bill_requested) {
          playAlertChime();
          toast.warning(`${before?.tables?.label ?? "A table"} requested the bill`, {
            description: `Order #${updated.order_number}`,
          });
        }

        setOrders((prev) => {
          const exists = prev.some((o) => o.id === updated.id);
          if (exists) return prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o));
          return prev;
        });

        if (!before) {
          const fullOrder = await fetchFull(updated.id);
          if (fullOrder) setOrders((prev) => (prev.some((o) => o.id === fullOrder.id) ? prev : [fullOrder, ...prev]));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function patchOrder(orderId: string, body: Record<string, unknown>) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function approve(order: Order) {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "accepted" } : o)));
    await patchOrder(order.id, { status: "accepted" });
    toast.success(`Order #${order.order_number} sent to the kitchen`);
  }

  async function decline(order: Order) {
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    await patchOrder(order.id, { status: "cancelled" });
  }

  async function resolveAlert(order: Order, field: "waiter_called" | "bill_requested") {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, [field]: false } : o)));
    await patchOrder(order.id, { [field]: false });
  }

  async function markBillPaid(order: Order) {
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    await patchOrder(order.id, { bill_settled: true });
    toast.success(`Bill for ${order.tables?.label} marked as paid`);
  }

  const waitingOrders = orders.filter((o) => o.status === "waiting").sort(byNewest);
  const kitchenOrders = orders.filter((o) => ["accepted", "preparing", "ready"].includes(o.status)).sort(byNewest);
  const billingOrders = orders.filter((o) => o.status === "served" && !o.bill_settled).sort(byNewest);
  const alertOrders = orders.filter((o) => o.waiter_called || o.bill_requested);

  return (
    <div className="mt-6 space-y-8">
      {alertOrders.length > 0 && (
        <section>
          <SectionTitle icon={Bell} title="Needs Attention" count={alertOrders.length} accent="text-chili" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertOrders.map((o) => (
              <div key={o.id} className="bg-chili/5 border border-chili/30 rounded-card p-4 animate-ticket-in">
                <div className="flex justify-between text-sm font-semibold">
                  <span>{o.tables?.label}</span>
                  <span className="font-mono text-ink/50">#{o.order_number}</span>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {o.waiter_called && (
                    <Button size="sm" variant="warning" onClick={() => resolveAlert(o, "waiter_called")}>
                      <Bell className="h-3.5 w-3.5" /> Waiter called — Resolve
                    </Button>
                  )}
                  {o.bill_requested && (
                    <Button size="sm" variant="outline" onClick={() => resolveAlert(o, "bill_requested")}>
                      <Receipt className="h-3.5 w-3.5" /> Bill requested — Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle icon={Clock} title="New Orders — Needs Your Approval" count={waitingOrders.length} accent="text-gold-dark" />
        {waitingOrders.length === 0 ? (
          <EmptyNote text="No new orders waiting for approval." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {waitingOrders.map((o) => (
              <div key={o.id} className="bg-white border-l-8 border-l-gold border border-espresso/5 rounded-card shadow-ticket p-4">
                <div className="flex justify-between font-semibold">
                  <span>{o.tables?.label}</span>
                  <span className="font-mono text-sm text-ink/50">#{o.order_number}</span>
                </div>
                <p className="text-xs text-ink/40 mt-0.5">{timeSince(o.created_at)}</p>
                <ul className="mt-2 space-y-1">
                  {o.order_items?.map((item) => (
                    <li key={item.id} className="text-sm">
                      <span className="font-semibold">{item.quantity}×</span> {item.item_name}
                      {item.notes && <span className="block text-xs text-chili italic">"{item.notes}"</span>}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="success" className="flex-1" onClick={() => approve(o)}>
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => decline(o)}>
                    <XCircle className="h-4 w-4" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle icon={CheckCircle2} title="In the Kitchen" count={kitchenOrders.length} accent="text-chili" />
        {kitchenOrders.length === 0 ? (
          <EmptyNote text="Nothing being cooked right now." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kitchenOrders.map((o) => (
              <div key={o.id} className="bg-white border border-espresso/5 rounded-card shadow-ticket p-4">
                <div className="flex justify-between font-semibold">
                  <span>{o.tables?.label}</span>
                  <span className="font-mono text-sm text-ink/50">#{o.order_number}</span>
                </div>
                <p className="text-xs text-ink/40 mt-0.5">{timeSince(o.created_at)}</p>
                <div className="mt-2">
                  <Badge className={STATUS_CONFIG[o.status].badge}>{STATUS_CONFIG[o.status].label}</Badge>
                </div>
                <p className="text-xs text-ink/40 mt-2">The kitchen is handling this order.</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle icon={BadgeCheck} title="Ready to Bill" count={billingOrders.length} accent="text-basil" />
        {billingOrders.length === 0 ? (
          <EmptyNote text="No served tables waiting to be billed." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {billingOrders.map((o) => (
              <div key={o.id} className="bg-white border border-espresso/5 rounded-card shadow-ticket p-4">
                <div className="flex justify-between font-semibold">
                  <span>{o.tables?.label}</span>
                  <span className="font-mono text-sm text-ink/50">#{o.order_number}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {o.order_items?.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}× {item.item_name}</span>
                      <span className="font-mono">{formatCurrency(item.line_total)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between font-semibold text-sm mt-2 pt-2 border-t border-espresso/10">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(o.grand_total)}</span>
                </div>
                <Button size="sm" className="w-full mt-3" onClick={() => markBillPaid(o)}>
                  Mark Bill Paid
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function byNewest(a: Order, b: Order) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function SectionTitle({
  icon: Icon,
  title,
  count,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={cn("h-4 w-4", accent)} />
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <span className="text-xs font-semibold text-ink/40 bg-espresso/5 rounded-full px-2 py-0.5">{count}</span>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-ink/40 bg-white border border-dashed border-espresso/10 rounded-card p-4">{text}</p>;
}
