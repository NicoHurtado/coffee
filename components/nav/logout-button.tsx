"use client";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Full-page load so the next user can't inherit this user's in-memory stores.
      window.location.assign("/login");
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-accent/50 hover:text-foreground disabled:opacity-50",
        className,
      )}
    >
      <LogOut className="size-[18px]" />
    </button>
  );
}
