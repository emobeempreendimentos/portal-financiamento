"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { AdminSidebar, BrandMark } from "@/components/layout/AdminSidebar";
import { TarefaNotificacoes } from "@/components/admin/TarefaNotificacoes";
import { BuscaRapida, abrirBuscaRapida } from "@/components/admin/BuscaRapida";
import { useToast } from "@/components/ui/toast";
import { User } from "@/types";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isRelatorio = pathname.includes("/relatorio");
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

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      addToast({ title: "Erro ao sair", variant: "error" });
    }
  }

  if (isRelatorio) return <>{children}</>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-[#c49e62] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TarefaNotificacoes />
      <BuscaRapida />

      {/* Barra superior (somente celular) */}
      <header className="md:hidden sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200/70 bg-background/85 px-4 backdrop-blur-xl dark:border-zinc-800">
        <BrandMark className="text-zinc-950 dark:text-white" />
        <div className="flex items-center gap-1">
          <button
            onClick={abrirBuscaRapida}
            className="p-2 rounded-xl text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <AdminSidebar
        user={user}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="md:pl-[276px] min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
