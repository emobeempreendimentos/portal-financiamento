"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { LayoutDashboard, Users, UserPlus, Landmark, User as UserIcon, Calculator, FileText, ReceiptText, ListTodo, FileSignature, LogOut, Moon, Sun, X } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { TAREFAS_CHANGED_EVENT } from "@/lib/tarefas";
import { User } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact: boolean;
  badge?: "tarefas";
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Geral",
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
      { href: "/admin/financeiro-pessoal", label: "Pessoal", icon: UserIcon, exact: false },
    ],
  },
];

interface AdminSidebarProps {
  user: User;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#e4c28c] via-[#c49e62] to-[#8b682b] flex items-center justify-center shadow-lg shadow-[#c49e62]/25">
        <span className="font-display text-[17px] font-extrabold text-[#1d1406] leading-none">E</span>
      </div>
      <div className="leading-none">
        <p className="font-display text-[17px] font-bold tracking-tight">Emobe</p>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-50 mt-1">Financiamento</p>
      </div>
    </div>
  );
}

export function AdminSidebar({ user, darkMode, onToggleDarkMode, onLogout, mobileOpen, onClose }: AdminSidebarProps) {
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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed z-50 top-3 bottom-3 left-3 w-[260px] rounded-[24px] bg-[#0e0f13] text-white shadow-2xl shadow-black/20 ring-1 ring-white/5 transition-transform duration-300 flex flex-col overflow-hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
        )}
      >
        {/* Brilho decorativo */}
        <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-[#c49e62]/20 blur-3xl" />

        {/* Marca */}
        <div className="relative flex items-center justify-between px-5 pt-6 pb-5">
          <BrandMark />
          <button onClick={onClose} className="md:hidden p-1.5 rounded-lg text-white/60 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="relative flex-1 overflow-y-auto scrollbar-hide px-3 pb-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
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
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-all duration-150",
                        active
                          ? "bg-white/[0.08] text-white font-semibold ring-1 ring-white/10"
                          : "text-white/55 font-medium hover:bg-white/[0.04] hover:text-white"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                          active ? "bg-[#c49e62] text-[#1d1406]" : "bg-white/[0.04] text-white/50 group-hover:text-white"
                        )}
                      >
                        <item.icon className="h-[15px] w-[15px]" />
                      </span>
                      <span className="truncate">{item.label}</span>
                      {item.badge === "tarefas" && tarefasPendentes > 0 && (
                        <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-[#c49e62] text-[#1d1406] text-[10px] font-bold flex items-center justify-center">
                          {tarefasPendentes > 99 ? "99+" : tarefasPendentes}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Usuário */}
        <div className="relative m-3 mt-0 rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.06] p-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-[#e4c28c] to-[#8b682b] flex items-center justify-center text-[#1d1406] text-xs font-bold overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.nome} className="h-9 w-9 object-cover" />
              ) : (
                getInitials(user.nome)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold truncate">{user.nome}</p>
              <p className="text-[11px] text-white/45 capitalize truncate">{user.role}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <button
              onClick={onToggleDarkMode}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] py-2 text-[11px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {darkMode ? "Claro" : "Escuro"}
            </button>
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] py-2 text-[11px] font-medium text-white/70 hover:bg-red-500/15 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
