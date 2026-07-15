"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  UtensilsCrossed,
  ClipboardList,
  BarChart3,
  QrCode,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/manager/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/manager/live", label: "Live Orders", icon: Radio },
  { href: "/manager/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/manager/orders", label: "Orders", icon: ClipboardList },
  { href: "/manager/reports", label: "Reports", icon: BarChart3 },
  { href: "/manager/qrcodes", label: "QR Codes", icon: QrCode },
];

export function ManagerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/manager/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream flex">
      <aside className="w-60 shrink-0 bg-espresso text-cream flex flex-col">
        <div className="px-5 py-6">
          <p className="font-display text-lg font-semibold">Rocco's Admin</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active ? "bg-chili text-white" : "text-cream/60 hover:bg-white/10 hover:text-cream"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-6">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream/60 hover:bg-white/10 hover:text-cream w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
