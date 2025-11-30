"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to login. Please check your credentials.";
      toast({ title: "Login failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.35),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.35),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(56,189,248,0.35),transparent_25%)]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-400 text-lg font-bold">
                  CV
                </div>
                <div>
                  <div className="text-lg font-semibold">CRM View</div>
                  <Link
                    href="https://www.crmview.net/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-200 hover:text-white"
                  >
                    www.crmview.net
                  </Link>
                </div>
              </div>
              <p className="mt-2 text-sm text-blue-100/80">
                Secure access to your ERP console.
              </p>
            </div>
          </div>

          <div className="mb-6 text-white">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-blue-100/80">Sign in to continue to CRM View ERP.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-100">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-white/80 text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-100">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/80 text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <Button
              className="mt-2 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 text-slate-900 font-semibold shadow-lg hover:opacity-90"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
