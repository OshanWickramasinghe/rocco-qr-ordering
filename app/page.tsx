import Link from "next/link";
import { ChefHat, LayoutDashboard, QrCode } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-espresso text-cream flex flex-col items-center justify-center px-6 text-center">
      <span className="text-5xl mb-4">🍕</span>
      <h1 className="font-display text-4xl font-semibold">Rocco's Pizza</h1>
      <p className="text-cream/60 mt-2 max-w-sm">
        Scan a table's QR code to order, or sign in below if you're staff.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 w-full max-w-lg">
        <Link
          href="/table/1"
          className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl px-4 py-5 flex flex-col items-center gap-2 transition-colors"
        >
          <QrCode className="h-6 w-6 text-gold" />
          <span className="text-sm font-semibold">Demo Table 1</span>
        </Link>
        <Link
          href="/chef/login"
          className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl px-4 py-5 flex flex-col items-center gap-2 transition-colors"
        >
          <ChefHat className="h-6 w-6 text-chili-light" />
          <span className="text-sm font-semibold">Chef Login</span>
        </Link>
        <Link
          href="/manager/login"
          className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl px-4 py-5 flex flex-col items-center gap-2 transition-colors"
        >
          <LayoutDashboard className="h-6 w-6 text-basil-light" />
          <span className="text-sm font-semibold">Manager Login</span>
        </Link>
      </div>
    </div>
  );
}
