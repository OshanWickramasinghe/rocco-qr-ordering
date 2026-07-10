"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn, timeSince } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

const ACTIVE_STATUSES: OrderStatus[] = ["waiting", "accepted", "preparing", "ready"];

const NEXT_ACTION: Partial<Record<OrderStatus, { next: OrderStatus; label: string; variant: "warning" | "primary" | "success" }>> = {
  waiting: { next: "accepted", label: "Accept", variant: "warning" },
  accepted: { next: "preparing", label: "Start Preparing", variant: "primary" },
  preparing: { next: "ready", label: "Mark Ready", variant: "success" },
  ready: { next: "served", label: "Mark Completed", variant: "success" },
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  waiting: "border-gold bg-gold/5",
  accepted: "border-chili bg-chili/5",
  preparing: "border-chili bg-chili/5",
  ready: "border-basil bg-basil/5",
  served: "border-espresso/10 bg-white",
  cancelled: "border-chili-dark/30 bg-chili-dark/5",
};

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.frequency.setValueAtTime(1180, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio not available (e.g. autoplay restrictions) — fail silently.
  }
}

export function KitchenBoard({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [soundOn, setSoundOn] = useState(true);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("kitchen-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, async (payload) => {
        const newOrder = payload.new as Order;
        const { data: fullOrder } = await supabase
          .from("orders")
          .select("*, order_items(*), tables(label)")
          .eq("id", newOrder.id)
          .single();
        if (fullOrder) {
          setOrders((prev) => [fullOrder as Order, ...prev]);
          if (soundOnRef.current) playChime();
          toast.info(`New order — ${fullOrder.tables?.label ?? "Table"} #${fullOrder.order_number}`);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const updated = payload.new as Order;
        setOrders((prev) =>
          updated && ACTIVE_STATUSES.includes(updated.status)
            ? prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
            : prev.filter((o) => o.id !== updated.id)
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function updateStatus(orderId: string, status: OrderStatus) {
    setOrders((prev) =>
      ACTIVE_STATUSES.includes(status)
        ? prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        : prev.filter((o) => o.id !== orderId)
    );
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/chef/login");
    router.refresh();
  }

  const sorted = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-espresso-dark">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="font-display text-2xl font-semibold text-cream">Kitchen Display</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-cream" onClick={() => setSoundOn((s) => !s)}>
            {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-cream" onClick={signOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="p-6">
        {sorted.length === 0 ? (
          <p className="text-cream/40 text-center mt-20">No active orders right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map((order) => {
              const action = NEXT_ACTION[order.status];
              return (
                <div
                  key={order.id}
                  className={cn("rounded-2xl border-2 p-4 shadow-lg animate-ticket-in", STATUS_STYLES[order.status])}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-bold">{order.tables?.label}</span>
                    <span className="font-mono text-sm text-ink/50">#{order.order_number}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink/50 mt-1">
                    <Clock className="h-3 w-3" />
                    {timeSince(order.created_at)}
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {order.order_items?.map((item) => (
                      <li key={item.id} className="text-sm">
                        <span className="font-semibold">{item.quantity}×</span> {item.item_name}
                        {item.notes && <p className="text-xs text-chili italic ml-4">"{item.notes}"</p>}
                      </li>
                    ))}
                  </ul>

                  {(order.waiter_called || order.bill_requested) && (
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {order.waiter_called && (
                        <span className="text-[11px] bg-gold/20 text-gold-dark px-2 py-0.5 rounded-full font-semibold">
                          🔔 Waiter called
                        </span>
                      )}
                      {order.bill_requested && (
                        <span className="text-[11px] bg-espresso/10 text-espresso px-2 py-0.5 rounded-full font-semibold">
                          🧾 Bill requested
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    {action && (
                      <Button
                        size="sm"
                        variant={action.variant}
                        className="flex-1"
                        onClick={() => updateStatus(order.id, action.next)}
                      >
                        {action.label}
                      </Button>
                    )}
                    {order.status !== "ready" && (
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(order.id, "cancelled")}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
