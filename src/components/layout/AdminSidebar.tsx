"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, UserPlus, Building2, ChevronRight, Landmark, User, Calculator, FileText } from "lucide-react";
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
    label: "Ferramentas",
    items: [
      { href: "/admin/simulacao", label: "Simulação", icon: Calculator, exact: false },
      { href: "/admin/documentos", label: "Documentos", icon: FileText, exact: false },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/admin/financeiro", label: "Empresa", icon: Landmark, exact: false },
      { href: "/admin/financeiro-pessoal", label: "Pessoal", icon: User, exact: false },
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
        <div className="flex h-full flex-col py-4 gap-0.5">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-3 px-3">
              <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-300 dark:text-zinc-600">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="relative block"
                    >
                      {active && (
                        <span className="absolute left-0 inset-y-1.5 w-[3px] bg-green-500 rounded-r-full" />
                      )}
                      <motion.div
                        whileHover={{ x: active ? 0 : 2 }}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                          active
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-green-600 dark:text-green-400" : "")} />
                        <span>{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-auto mx-3 p-3 rounded-2xl bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-900/30">
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
