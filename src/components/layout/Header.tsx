"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { getInitials } from "@/lib/utils";
import { BrandMark } from "@/components/layout/AdminSidebar";
import { User } from "@/types";

interface HeaderProps {
  user: User;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Header({ user, darkMode, onToggleDarkMode }: HeaderProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      addToast({ title: "Erro ao sair", variant: "error" });
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full px-3 pt-3">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between rounded-2xl border border-white/60 bg-white/75 px-3 pl-4 shadow-soft backdrop-blur-xl dark:border-white/5 dark:bg-zinc-900/75">
        <BrandMark className="text-zinc-950 dark:text-white" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
            aria-label="Alternar tema"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-3 bg-zinc-100/80 dark:bg-zinc-800/70">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#e4c28c] to-[#8b682b] flex items-center justify-center text-[#1d1406] text-xs font-bold overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.nome} className="h-8 w-8 object-cover" />
              ) : (
                getInitials(user.nome)
              )}
            </div>
            <p className="hidden sm:block max-w-[160px] truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
              {user.nome.split(" ")[0]}
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-2.5 rounded-xl text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors disabled:opacity-50"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
