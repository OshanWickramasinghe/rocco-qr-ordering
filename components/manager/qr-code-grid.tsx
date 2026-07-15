"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TableRow } from "@/lib/types";

export function QrCodeGrid({ tables }: { tables: TableRow[] }) {
  const [codes, setCodes] = useState<Record<number, string>>({});
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    // Prefer a fixed, configured address (NEXT_PUBLIC_SITE_URL) so QR codes
    // always point to your permanent site — never a temporary Vercel preview
    // link, even if this page happens to be opened through one.
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
    setSiteUrl(configuredUrl || window.location.origin);
  }, []);

  useEffect(() => {
    if (!siteUrl) return;
    (async () => {
      const entries = await Promise.all(
        tables.map(async (t) => {
          const dataUrl = await QRCode.toDataURL(`${siteUrl}/table/${t.id}`, {
            width: 320,
            margin: 1,
            color: { dark: "#2B1B12", light: "#FFFFFF" },
          });
          return [t.id, dataUrl] as const;
        })
      );
      setCodes(Object.fromEntries(entries));
    })();
  }, [siteUrl, tables]);

  function download(tableId: number, label: string) {
    const dataUrl = codes[tableId];
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${label.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    a.click();
  }

  async function downloadAll() {
    for (const t of tables) {
      download(t.id, t.label);
      // small delay so the browser doesn't block multiple downloads
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  return (
    <div className="mt-6">
      <Button variant="outline" onClick={downloadAll} className="mb-4">
        <Download className="h-4 w-4" /> Download All
      </Button>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((t) => (
          <div key={t.id} className="bg-white rounded-card border border-espresso/5 shadow-ticket p-4 text-center">
            {codes[t.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={codes[t.id]} alt={`QR for ${t.label}`} className="w-full rounded-lg" />
            ) : (
              <div className="aspect-square bg-espresso/5 rounded-lg animate-pulse-soft" />
            )}
            <p className="font-semibold text-sm mt-2">{t.label}</p>
            <p className="text-xs text-ink/40">{t.seats} seats</p>
            <Button size="sm" variant="ghost" className="mt-1 w-full" onClick={() => download(t.id, t.label)}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
