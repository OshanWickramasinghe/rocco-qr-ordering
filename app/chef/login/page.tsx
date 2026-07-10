"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChefHat } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChefLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Invalid email or password.");
      return;
    }
    router.push("/chef/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-card p-8 shadow-ticket">
        <div className="h-12 w-12 rounded-full bg-chili flex items-center justify-center mx-auto">
          <ChefHat className="h-6 w-6 text-white" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-center mt-4">Kitchen Login</h1>
        <p className="text-sm text-ink/50 text-center mt-1">Sign in to view incoming orders</p>

        <div className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-semibold text-ink/60">Email</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink/60">Password</label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full mt-6" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
