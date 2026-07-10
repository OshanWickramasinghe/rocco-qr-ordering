import { createClient } from "@/lib/supabase/server";
import { ManagerShell } from "@/components/manager/manager-shell";
import { MenuManager } from "@/components/manager/menu-manager";

export const dynamic = "force-dynamic";

export default async function ManagerMenuPage() {
  const supabase = createClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("menu_items").select("*").order("sort_order"),
  ]);

  return (
    <ManagerShell>
      <div className="p-8">
        <h1 className="font-display text-2xl font-semibold">Menu</h1>
        <p className="text-sm text-ink/50 mt-1">Manage categories, pizzas, drinks, prices and availability.</p>
        <MenuManager initialCategories={categories ?? []} initialItems={items ?? []} />
      </div>
    </ManagerShell>
  );
}
