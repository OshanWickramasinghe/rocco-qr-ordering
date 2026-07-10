import { createClient } from "@/lib/supabase/server";
import { ManagerShell } from "@/components/manager/manager-shell";
import { QrCodeGrid } from "@/components/manager/qr-code-grid";

export const dynamic = "force-dynamic";

export default async function ManagerQrCodesPage() {
  const supabase = createClient();
  const { data: tables } = await supabase.from("tables").select("*").order("id");

  return (
    <ManagerShell>
      <div className="p-8">
        <h1 className="font-display text-2xl font-semibold">QR Codes</h1>
        <p className="text-sm text-ink/50 mt-1">
          One QR per table, linking straight to that table's menu. Print and stick one on every table.
        </p>
        <QrCodeGrid tables={tables ?? []} />
      </div>
    </ManagerShell>
  );
}
