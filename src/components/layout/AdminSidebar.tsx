"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, UserPlus, Building2, ChevronRight, Landmark, User, Calculator, FileText, ReceiptText, ListTodo, FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";
import { TAREFAS_CHANGED_EVENT } from "@/lib/tarefas";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact: boolean;
  badge?: "tarefas";
}

const navGroups: { label: string; items: NavItem[] }[] = [
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
      { href: "/admin/tarefas", label: "Lista de Tarefas", icon: ListTodo, exact: false, badge: "tarefas" },
      { href: "/admin/simulacao", label: "Simulação", icon: Calculator, exact: false },
      { href: "/admin/recibo", label: "Gerador de Recibo", icon: ReceiptText, exact: false },
      { href: "/admin/termos", label: "Termos para Envio", icon: FileSignature, exact: false },
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
  const [tarefasPendentes, setTarefasPendentes] = useState(0);

  const carregarContador = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tarefas/resumo");
      const json = await res.json();
      if (json.success) setTarefasPendentes(json.data.abertas ?? 0);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    carregarContador();
    window.addEventListener(TAREFAS_CHANGED_EVENT, carregarContador);
    return () => window.removeEventListener(TAREFAS_CHANGED_EVENT, carregarContador);
  }, [carregarContador]);

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
          "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 overflow-y-auto scrollbar-hide border-r border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-[#0b0c0f] transition-transform duration-300",
          "md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex min-h-full flex-col py-5 gap-0.5">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4 px-3">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
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
                        <span className="absolute -left-3 inset-y-1.5 w-[3px] bg-[#c49e62] rounded-r-full" />
                      )}
                      <motion.div
                        whileHover={{ x: active ? 0 : 2 }}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                          active
                            ? "bg-[#f9edd8] text-[#1d1406] font-semibold dark:bg-[#332710] dark:text-[#edc889]"
                            : "font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-[#8b682b] dark:text-[#d9b06b]" : "text-zinc-400 dark:text-zinc-500")} />
                        <span>{item.label}</span>
                        {item.badge === "tarefas" && tarefasPendentes > 0 && (
                          <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-[#c49e62] text-[#1d1406] text-[10px] font-bold flex items-center justify-center">
                            {tarefasPendentes > 99 ? "99+" : tarefasPendentes}
                          </span>
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-auto mx-3 p-4 rounded-2xl bg-[#16181d] text-white relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#c49e62]/25 blur-2xl" />
            <div className="relative flex items-center gap-2 mb-1.5">
              <Building2 className="h-4 w-4 text-[#d9b06b]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d9b06b]">Portal Admin</span>
            </div>
            <p className="relative font-display text-[15px] leading-snug text-white/90">
              Gerencie todos os processos de <em>financiamento</em>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
