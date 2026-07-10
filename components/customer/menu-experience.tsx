"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Flame, Sparkles, Star, Plus, Minus, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import type { CartLine, Category, MenuItem, RestaurantSettings, TableRow } from "@/lib/types";

interface Props {
  table: TableRow;
  categories: Category[];
  menuItems: MenuItem[];
  settings: RestaurantSettings | null;
  promotions: { title: string; description: string | null; discount_percent: number | null; menu_items: { name: string } | null }[];
}

export function MenuExperience({ table, categories, menuItems, settings, promotions }: Props) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const currency = settings?.currency ?? "LKR";

  const cartLines = Object.values(cart);
  const cartCount = cartLines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = cartLines.reduce((sum, l) => sum + l.menuItem.price * l.quantity, 0);
  const vatAmount = subtotal * ((settings?.vat_rate ?? 0) / 100);
  const grandTotal = subtotal + vatAmount;

  const itemsByCategory = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    for (const item of menuItems) {
      if (!map[item.category_id]) map[item.category_id] = [];
      map[item.category_id].push(item);
    }
    return map;
  }, [menuItems]);

  function addToCart(item: MenuItem, quantity: number, notes: string) {
    setCart((prev) => {
      const existingKey = item.id + "-" + notes;
      return {
        ...prev,
        [existingKey]: {
          menuItem: item,
          quantity: (prev[existingKey]?.quantity ?? 0) + quantity,
          notes,
        },
      };
    });
    toast.success(`Added ${item.name} to your order`);
    setDetailItem(null);
  }

  function updateLineQty(key: string, delta: number) {
    setCart((prev) => {
      const line = prev[key];
      if (!line) return prev;
      const newQty = line.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: { ...line, quantity: newQty } };
    });
  }

  async function placeOrder() {
    if (cartLines.length === 0) return;
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: table.id,
          lines: cartLines.map((l) => ({
            menuItemId: l.menuItem.id,
            quantity: l.quantity,
            notes: l.notes,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Order placed! Tracking your food now.");
      router.push(`/order/${data.order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong placing your order.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream pb-32">
      {/* Header */}
      <header className="bg-espresso text-cream px-5 pt-8 pb-6 rounded-b-[2rem]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">{table.label}</p>
            <h1 className="font-display text-3xl font-semibold mt-1">
              {settings?.restaurant_name ?? "Rocco's Pizza"}
            </h1>
          </div>
          <div className="h-12 w-12 rounded-full bg-chili flex items-center justify-center font-display text-lg">
            🍕
          </div>
        </div>
        {promotions.length > 0 && (
          <div className="mt-5 rounded-xl bg-white/10 border border-gold/30 px-4 py-3 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-gold shrink-0" />
            <p className="text-sm">
              <span className="font-semibold text-gold">{promotions[0].title}:</span>{" "}
              {promotions[0].description}
            </p>
          </div>
        )}
      </header>

      {/* Category tabs */}
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-espresso/10 px-5 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition-colors",
                activeCategory === cat.id
                  ? "bg-chili text-white border-chili"
                  : "bg-white text-ink/70 border-espresso/10 hover:border-chili/40"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu */}
      <main className="px-5 mt-4 space-y-8">
        {categories.map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`}>
            <h2 className="font-display text-xl font-semibold mb-3">{cat.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(itemsByCategory[cat.id] ?? []).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setDetailItem(item)}
                  disabled={!item.is_available}
                  className={cn(
                    "text-left bg-white rounded-card border border-espresso/5 shadow-ticket overflow-hidden hover:-translate-y-0.5 transition-transform",
                    !item.is_available && "opacity-50 pointer-events-none"
                  )}
                >
                  <div className="relative h-36 w-full bg-espresso/5">
                    {item.image_url && (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover"
                      />
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {item.is_popular && (
                        <Badge className="bg-gold text-espresso border-gold-dark">
                          <Star className="h-3 w-3" /> Popular
                        </Badge>
                      )}
                      {item.is_new && (
                        <Badge className="bg-basil text-white border-basil">New</Badge>
                      )}
                    </div>
                    {item.is_spicy && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-chili text-white border-chili-dark">
                          <Flame className="h-3 w-3" />
                        </Badge>
                      </div>
                    )}
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm font-semibold text-ink/70">
                        Sold out
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-snug">{item.name}</h3>
                      <span className="font-mono text-sm font-semibold shrink-0">
                        {formatCurrency(item.price, currency)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-ink/60 mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-[11px] text-ink/40 mt-1.5">{item.prep_time_minutes} min prep</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Item detail modal */}
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          currency={currency}
          onClose={() => setDetailItem(null)}
          onAdd={addToCart}
        />
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <CartDrawer
          cartLines={cartLines}
          currency={currency}
          subtotal={subtotal}
          vatRate={settings?.vat_rate ?? 0}
          vatAmount={vatAmount}
          grandTotal={grandTotal}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateLineQty}
          onPlaceOrder={placeOrder}
          placing={placing}
        />
      )}

      {/* Floating cart bar */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-5 right-5 z-30 bg-espresso text-cream rounded-2xl shadow-xl px-5 py-4 flex items-center justify-between animate-ticket-in"
        >
          <span className="flex items-center gap-2 font-semibold text-sm">
            <ShoppingBag className="h-5 w-5" />
            {cartCount} item{cartCount > 1 ? "s" : ""} in cart
          </span>
          <span className="font-mono font-bold">{formatCurrency(grandTotal, currency)}</span>
        </button>
      )}
    </div>
  );
}

function ItemDetailModal({
  item,
  currency,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  currency: string;
  onClose: () => void;
  onAdd: (item: MenuItem, quantity: number, notes: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center sm:justify-center bg-espresso/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-card max-h-[90vh] overflow-y-auto animate-ticket-in">
        <div className="relative h-56 w-full bg-espresso/5">
          {item.image_url && (
            <Image src={item.image_url} alt={item.name} fill sizes="500px" className="object-cover" />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">{item.name}</h2>
            <span className="font-mono font-bold text-chili">{formatCurrency(item.price, currency)}</span>
          </div>
          {item.description && <p className="text-sm text-ink/60 mt-2">{item.description}</p>}

          <div className="mt-5">
            <label className="text-xs font-semibold text-ink/60 uppercase tracking-wide">
              Special instructions
            </label>
            <Textarea
              className="mt-1.5"
              rows={2}
              placeholder='e.g. "No onions", "Extra cheese", "Well done"'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-3 bg-cream rounded-full px-2 py-1 border border-espresso/10">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button size="lg" onClick={() => onAdd(item, qty, notes)}>
              Add {formatCurrency(item.price * qty, currency)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  cartLines,
  currency,
  subtotal,
  vatRate,
  vatAmount,
  grandTotal,
  onClose,
  onUpdateQty,
  onPlaceOrder,
  placing,
}: {
  cartLines: CartLine[];
  currency: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  onClose: () => void;
  onUpdateQty: (key: string, delta: number) => void;
  onPlaceOrder: () => void;
  placing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-espresso/50 backdrop-blur-sm">
      <div className="w-full bg-white rounded-t-[2rem] max-h-[85vh] flex flex-col animate-ticket-in">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-espresso/10">
          <h2 className="font-display text-xl font-semibold">Your Order</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-cream flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {cartLines.length === 0 && <p className="text-sm text-ink/50 py-8 text-center">Your cart is empty.</p>}
          {cartLines.map((line) => {
            const key = line.menuItem.id + "-" + line.notes;
            return (
              <div key={key} className="flex items-center justify-between gap-3 border-b border-espresso/5 pb-3">
                <div>
                  <p className="font-semibold text-sm">{line.menuItem.name}</p>
                  {line.notes && <p className="text-xs text-ink/50 italic">"{line.notes}"</p>}
                  <p className="text-xs text-ink/50 mt-0.5">{formatCurrency(line.menuItem.price, currency)} each</p>
                </div>
                <div className="flex items-center gap-2 bg-cream rounded-full px-1.5 py-1 border border-espresso/10 shrink-0">
                  <button onClick={() => onUpdateQty(key, -1)} className="h-7 w-7 rounded-full bg-white flex items-center justify-center">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{line.quantity}</span>
                  <button onClick={() => onUpdateQty(key, 1)} className="h-7 w-7 rounded-full bg-white flex items-center justify-center">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-4 border-t border-espresso/10 space-y-1.5 bg-cream/50">
          <div className="flex justify-between text-sm text-ink/60">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-sm text-ink/60">
            <span>VAT ({vatRate}%)</span>
            <span className="font-mono">{formatCurrency(vatAmount, currency)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-1">
            <span>Total</span>
            <span className="font-mono">{formatCurrency(grandTotal, currency)}</span>
          </div>
          <Button size="lg" className="w-full mt-3" disabled={cartLines.length === 0 || placing} onClick={onPlaceOrder}>
            {placing ? "Placing your order…" : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
