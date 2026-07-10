"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { Category, MenuItem } from "@/lib/types";

export function MenuManager({
  initialCategories,
  initialItems,
}: {
  initialCategories: Category[];
  initialItems: MenuItem[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const [activeCategory, setActiveCategory] = useState(initialCategories[0]?.id ?? "");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName, sort_order: categories.length }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error);
    setCategories((prev) => [...prev, data.category]);
    setNewCategoryName("");
    toast.success("Category added");
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category and all its items?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Could not delete category");
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setItems((prev) => prev.filter((i) => i.category_id !== id));
    toast.success("Category deleted");
  }

  async function saveItem() {
    if (!editingItem?.name || !editingItem?.category_id || editingItem.price == null) {
      toast.error("Name, category and price are required");
      return;
    }
    const isNew = !editingItem.id;
    const url = isNew ? "/api/menu-items" : `/api/menu-items/${editingItem.id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingItem),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error);
    if (isNew) {
      setItems((prev) => [...prev, data.item]);
    } else {
      setItems((prev) => prev.map((i) => (i.id === data.item.id ? data.item : i)));
    }
    toast.success(isNew ? "Item added" : "Item updated");
    setEditingItem(null);
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Could not delete item");
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Item deleted");
  }

  async function toggleAvailability(item: MenuItem) {
    const res = await fetch(`/api/menu-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: !item.is_available }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error("Could not update item");
    setItems((prev) => prev.map((i) => (i.id === item.id ? data.item : i)));
  }

  const visibleItems = items.filter((i) => i.category_id === activeCategory);

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      {/* Category sidebar */}
      <div className="bg-white rounded-card border border-espresso/5 shadow-ticket p-4 h-fit">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-2">Categories</p>
        <div className="space-y-1">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-1">
              <button
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium",
                  activeCategory === cat.id ? "bg-chili text-white" : "hover:bg-cream"
                )}
              >
                {cat.name}
              </button>
              <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-ink/30 hover:text-chili">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-1.5">
          <Input
            placeholder="New category"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="text-sm"
          />
          <Button size="sm" onClick={addCategory}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-card border border-espresso/5 shadow-ticket p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            Items ({visibleItems.length})
          </p>
          <Button
            size="sm"
            onClick={() => setEditingItem({ category_id: activeCategory, is_available: true, prep_time_minutes: 15 })}
          >
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>

        <div className="space-y-2">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 border border-espresso/5 rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{item.name}</p>
                  {item.is_popular && <Badge className="bg-gold/15 text-gold-dark border-gold/30">Popular</Badge>}
                  {item.is_new && <Badge className="bg-basil/15 text-basil border-basil/30">New</Badge>}
                  {item.is_spicy && <Badge className="bg-chili/10 text-chili border-chili/30">Spicy</Badge>}
                </div>
                <p className="text-xs text-ink/50 truncate">{item.description}</p>
              </div>
              <span className="font-mono text-sm font-semibold shrink-0">{formatCurrency(item.price)}</span>
              <button
                onClick={() => toggleAvailability(item)}
                className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-full shrink-0",
                  item.is_available ? "bg-basil/15 text-basil" : "bg-ink/10 text-ink/40"
                )}
              >
                {item.is_available ? "Available" : "Unavailable"}
              </button>
              <button onClick={() => setEditingItem(item)} className="p-1.5 text-ink/40 hover:text-chili shrink-0">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => deleteItem(item.id)} className="p-1.5 text-ink/40 hover:text-chili shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {visibleItems.length === 0 && <p className="text-sm text-ink/40 py-8 text-center">No items yet.</p>}
        </div>
      </div>

      {editingItem && (
        <ItemEditorModal
          item={editingItem}
          categories={categories}
          onChange={setEditingItem}
          onClose={() => setEditingItem(null)}
          onSave={saveItem}
        />
      )}
    </div>
  );
}

function ItemEditorModal({
  item,
  categories,
  onChange,
  onClose,
  onSave,
}: {
  item: Partial<MenuItem>;
  categories: Category[];
  onChange: (item: Partial<MenuItem>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-espresso/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-white rounded-card p-6 shadow-ticket max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">{item.id ? "Edit Item" : "Add Item"}</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-ink/60">Name</label>
            <Input value={item.name ?? ""} onChange={(e) => onChange({ ...item, name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink/60">Category</label>
            <select
              value={item.category_id ?? ""}
              onChange={(e) => onChange({ ...item, category_id: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-espresso/15 bg-white px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink/60">Description</label>
            <Textarea
              value={item.description ?? ""}
              onChange={(e) => onChange({ ...item, description: e.target.value })}
              className="mt-1"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink/60">Price</label>
              <Input
                type="number"
                value={item.price ?? ""}
                onChange={(e) => onChange({ ...item, price: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink/60">Prep Time (min)</label>
              <Input
                type="number"
                value={item.prep_time_minutes ?? 15}
                onChange={(e) => onChange({ ...item, prep_time_minutes: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink/60">Image URL</label>
            <Input
              value={item.image_url ?? ""}
              onChange={(e) => onChange({ ...item, image_url: e.target.value })}
              placeholder="https://…"
              className="mt-1"
            />
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            {(["is_available", "is_spicy", "is_popular", "is_new"] as const).map((flag) => (
              <label key={flag} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(item[flag])}
                  onChange={(e) => onChange({ ...item, [flag]: e.target.checked })}
                />
                {flag.replace("is_", "").replace(/^\w/, (c) => c.toUpperCase())}
              </label>
            ))}
          </div>
        </div>

        <Button size="lg" className="w-full mt-5" onClick={onSave}>
          Save Item
        </Button>
      </div>
    </div>
  );
}
