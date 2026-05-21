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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
          <div className="flex items-center">
            <img
              src="/logo.jpeg"
              alt="Emobe"
              className="h-9 w-auto object-contain"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-2.5 ml-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="h-9 w-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold shadow-sm cursor-pointer"
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
