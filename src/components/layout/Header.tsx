"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getInitials } from "@/lib/utils";
import { User } from "@/types";

interface HeaderProps {
  user: User;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

export function Header({ user, darkMode, onToggleDarkMode, onToggleMobileMenu, mobileMenuOpen }: HeaderProps) {
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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-[#fafaf9]/85 backdrop-blur-xl dark:border-zinc-800 dark:bg-[#0b0c0f]/85">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        {/* Marca (mesma assinatura tipográfica do site emobe.com.br) */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
          <div className="flex items-baseline gap-2 select-none" aria-label="Emobe Financiamento">
            <span className="font-display text-[26px] leading-none tracking-[-0.02em] text-zinc-950 dark:text-white">
              Emobe
            </span>
            <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              Financiamento
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-zinc-200 dark:border-zinc-800">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="h-9 w-9 rounded-full bg-[#16181d] dark:bg-[#f9edd8] flex items-center justify-center text-[#e4c28c] dark:text-[#1d1406] text-sm font-semibold shadow-sm ring-2 ring-[#fafaf9] dark:ring-zinc-900 cursor-pointer"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.nome} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                getInitials(user.nome)
              )}
            </motion.div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">{user.nome}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight capitalize">{user.role}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={loggingOut}
            className="ml-1 text-zinc-500 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
