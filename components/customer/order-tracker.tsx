"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Bell, Receipt, Star } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn, formatCurrency, ORDER_TIMELINE_STEPS, STATUS_CONFIG, timeSince } from "@/lib/utils";
import type { Order } from "@/lib/types";

export function OrderTracker({ initialOrder, currency }: { initialOrder: Order; currency: string }) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [waiterCalled, setWaiterCalled] = useState(initialOrder.waiter_called);
  const [billRequested, setBillRequested] = useState(initialOrder.bill_requested);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        (payload) => {
          const updated = payload.new as Order;
          setOrder((prev) => ({ ...prev, ...updated }));
          setWaiterCalled(updated.waiter_called);
          setBillRequested(updated.bill_requested);
          if (updated.status !== order.status) {
            toast.info(`Your order is now: ${STATUS_CONFIG[updated.status].label}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  async function callWaiter() {
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waiter_called: true }),
      });
      if (!res.ok) throw new Error();
      setWaiterCalled(true);
      toast.success("Waiter has been notified");
    } catch {
      toast.error("Could not reach the kitchen — please ask a staff member directly.");
    }
  }

  async function requestBill() {
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill_requested: true }),
      });
      if (!res.ok) throw new Error();
      setBillRequested(true);
      toast.success("Bill requested — someone will be over shortly");
    } catch {
      toast.error("Could not reach the kitchen — please ask a staff member directly.");
    }
  }

  const config = STATUS_CONFIG[order.status];
  const currentStep = config.step;

  return (
    <div className="min-h-screen bg-cream px-5 py-8 pb-20">
      <div className="max-w-md mx-auto">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-ink/40">
          {order.tables?.label} · Order #{order.order_number}
        </p>

        {/* Ticket card */}
        <div className="ticket-edge bg-white rounded-b-card shadow-ticket mt-4 overflow-hidden">
          <div className="pt-6 px-6 pb-5 text-center border-b border-dashed border-espresso/15">
            {order.status === "cancelled" ? (
              <span className="inline-block text-4xl mb-2">✕</span>
            ) : order.status === "served" ? (
              <span className="inline-block text-4xl mb-2">✓</span>
            ) : (
              <span className="inline-block text-4xl mb-2 animate-pulse-soft">🍕</span>
            )}
            <h1 className="font-display text-2xl font-semibold">{config.label}</h1>
            <p className="text-sm text-ink/50 mt-1">
              {order.status === "cancelled"
                ? "This order was cancelled."
                : order.status === "served"
                ? "Enjoy your meal!"
                : `Estimated ready in ~${order.estimated_ready_minutes} min`}
            </p>
          </div>

          {order.status !== "cancelled" && (
            <div className="px-6 py-6">
              <ol className="space-y-4">
                {ORDER_TIMELINE_STEPS.map((step, i) => {
                  const done = currentStep >= i;
                  return (
                    <li key={step.key} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center shrink-0 border-2",
                          done ? "bg-basil border-basil text-white" : "bg-white border-espresso/15 text-transparent"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </span>
                      <span className={cn("text-sm font-medium", done ? "text-ink" : "text-ink/35")}>
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Items */}
          <div className="px-6 py-5 border-t border-dashed border-espresso/15">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-3">Items</h3>
            <div className="space-y-2">
              {order.order_items?.map((oi) => (
                <div key={oi.id} className="flex justify-between text-sm">
                  <span>
                    {oi.quantity}× {oi.item_name}
                    {oi.notes && <span className="block text-xs text-ink/45 italic">"{oi.notes}"</span>}
                  </span>
                  <span className="font-mono">{formatCurrency(oi.line_total, currency)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-espresso/10 flex justify-between font-semibold">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(order.grand_total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {order.status !== "cancelled" && order.status !== "served" && (
          <div className="grid grid-cols-2 gap-3 mt-5">
            <Button variant="outline" onClick={callWaiter} disabled={waiterCalled}>
              <Bell className="h-4 w-4" />
              {waiterCalled ? "Waiter notified" : "Call Waiter"}
            </Button>
            <Button variant="outline" onClick={requestBill} disabled={billRequested}>
              <Receipt className="h-4 w-4" />
              {billRequested ? "Bill requested" : "Request Bill"}
            </Button>
          </div>
        )}

        {order.status === "served" && !reviewDone && (
          <ReviewForm
            orderId={order.id}
            tableId={order.table_id}
            onSubmitted={() => setReviewDone(true)}
            onSkip={() => setReviewDone(true)}
          />
        )}
        {order.status === "served" && reviewDone && (
          <p className="text-center text-sm text-basil font-medium mt-6">Thanks! 🎉</p>
        )}

        {(order.status === "served" || order.status === "cancelled") && (
          <Link href={`/table/${order.table_id}`}>
            <Button variant="secondary" size="lg" className="w-full mt-5">
              Back to Menu
            </Button>
          </Link>
        )}

        <p className="text-center text-xs text-ink/30 mt-8">Placed {timeSince(order.created_at)}</p>
      </div>
    </div>
  );
}

function ReviewForm({
  orderId,
  tableId,
  onSubmitted,
  onSkip,
}: {
  orderId: string;
  tableId: number;
  onSubmitted: () => void;
  onSkip: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (rating === 0) {
      toast.error("Please choose a star rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, tableId, rating, comment }),
      });
      if (!res.ok) throw new Error();
      onSubmitted();
    } catch {
      toast.error("Could not submit your review, please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-card shadow-ticket mt-5 p-5">
      <h3 className="font-display text-lg font-semibold">How was everything?</h3>
      <div className="flex gap-2 mt-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)}>
            <Star className={cn("h-8 w-8", n <= rating ? "fill-gold text-gold" : "text-espresso/15")} />
          </button>
        ))}
      </div>
      <Textarea
        className="mt-3"
        rows={3}
        placeholder="Tell us more (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex gap-2 mt-3">
        <Button variant="ghost" className="shrink-0" onClick={onSkip} disabled={submitting}>
          Skip
        </Button>
        <Button className="flex-1" onClick={submit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Review"}
        </Button>
      </div>
    </div>
  );
}
