"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useToast } from "@/components/ui/toast";
import { User } from "@/types";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.data))
      .catch(() => addToast({ title: "Sessão expirada", variant: "error" }));
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header
        user={user}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
        mobileMenuOpen={mobileOpen}
      />
      <div className="flex">
        <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-[calc(100vh-4rem)]">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
