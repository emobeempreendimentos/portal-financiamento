"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, UserPlus, Building2, ChevronRight, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Navegação",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/clientes", label: "Clientes", icon: Users, exact: false },
      { href: "/admin/clientes/novo", label: "Novo Cliente", icon: UserPlus, exact: true },
    ],
  },
  {
    label: "Empresa",
    items: [
      { href: "/admin/financeiro", label: "Controle Financeiro", icon: Landmark, exact: false },
    ],
  },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r border-zinc-100 bg-white transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-950",
          "md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col p-4 gap-1">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="relative"
                  >
                    <motion.div
                      whileHover={{ x: 2 }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        active
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                      {active && (
                        <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="mt-auto p-3 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-900/30">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-green-700 dark:text-green-400">Portal Admin</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Gerencie todos os processos de financiamento
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
