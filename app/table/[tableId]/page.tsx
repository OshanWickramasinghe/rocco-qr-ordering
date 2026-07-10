import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MenuExperience } from "@/components/customer/menu-experience";

export const dynamic = "force-dynamic";

export default async function TablePage({ params }: { params: { tableId: string } }) {
  const tableId = Number(params.tableId);
  if (!Number.isFinite(tableId)) notFound();

  const supabase = createClient();

  const [{ data: table }, { data: categories }, { data: menuItems }, { data: settings }, { data: promotions }] =
    await Promise.all([
      supabase.from("tables").select("*").eq("id", tableId).single(),
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("menu_items").select("*").order("sort_order"),
      supabase.from("restaurant_settings").select("*").eq("id", 1).single(),
      supabase.from("promotions").select("*, menu_items(name)").eq("is_active", true),
    ]);

  if (!table) notFound();

  return (
    <MenuExperience
      table={table}
      categories={categories ?? []}
      menuItems={menuItems ?? []}
      settings={settings}
      promotions={promotions ?? []}
    />
  );
}
