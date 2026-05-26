"use client";

import { useState, useLayoutEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  type: "item";
  id: string;
  label: string;
  icon: string;
  href: string;
}

interface NavCategory {
  type: "category";
  id: string;
  label: string;
  items: NavItem[];
}

type NavEntry = NavItem | NavCategory;

const NAV_ITEMS: NavEntry[] = [
  { type: "item", id: "escritorio-virtual", label: "Escritório Virtual", icon: "gamepad", href: "/game" },
  { type: "item", id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/fenix-lab?tab=dashboard" },
  { type: "item", id: "minhas-tasks", label: "Minhas Tasks", icon: "task_alt", href: "/fenix-lab?tab=minhas-tasks" },
  { type: "item", id: "pub-history", label: "Publicações", icon: "article", href: "/fenix-lab?tab=pub-history" },
  { type: "item", id: "calendario", label: "Calendário", icon: "calendar_month", href: "/fenix-lab?tab=calendario" },
  { type: "item", id: "meta-publish", label: "Histórico de Agendamentos", icon: "schedule", href: "/fenix-lab?tab=meta-publish" },
  {
    type: "category",
    id: "cat-clientes",
    label: "CLIENTES",
    items: [
      { type: "item", id: "all-clients", label: "Todos os Clientes", icon: "group", href: "/fenix-lab?tab=clientes" },
      { type: "item", id: "onboarding", label: "Novo Cliente", icon: "person_add", href: "/fenix-lab?tab=onboarding" },
      { type: "item", id: "instagram-360", label: "Instagram", icon: "photo_camera", href: "/portal/instagram" },
    ],
  },
  {
    type: "category",
    id: "cat-cronogramas",
    label: "CRONOGRAMAS",
    items: [
      { type: "item", id: "sched-weekly", label: "Cronograma HTML", icon: "html", href: "/fenix-lab?tab=cronograma" },
    ],
  },
  {
    type: "category",
    id: "cat-relatorios",
    label: "RELATÓRIOS",
    items: [
      { type: "item", id: "weekly", label: "Semanal", icon: "bar_chart", href: "/fenix-lab?tab=weekly" },
      { type: "item", id: "monthly", label: "Mensal", icon: "insert_chart", href: "/fenix-lab?tab=monthly" },
    ],
  },
  {
    type: "category",
    id: "cat-meta",
    label: "META ADS",
    items: [
      { type: "item", id: "meta-config", label: "Configuração", icon: "settings", href: "/fenix-lab?tab=meta-config" },
      { type: "item", id: "meta-balance", label: "Saldo de Crédito", icon: "account_balance_wallet", href: "/fenix-lab?tab=meta-balance" },
      { type: "item", id: "meta-bi", label: "Business Intelligence", icon: "insights", href: "/fenix-lab?tab=meta-bi" },
    ],
  },
  {
    type: "category",
    id: "cat-geral",
    label: "GERAL",
    items: [
      { type: "item", id: "clients", label: "Clientes", icon: "people", href: "/fenix-lab?tab=clients" },
      { type: "item", id: "history", label: "Histórico", icon: "history", href: "/fenix-lab?tab=history" },
      { type: "item", id: "system-logs", label: "Logs do Sistema", icon: "terminal", href: "/fenix-lab?tab=system-logs" },
    ],
  },
];

export default function UnifiedSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    const storedCollapsed = localStorage.getItem("unified-sidebar-collapsed");
    if (storedCollapsed !== null) setCollapsed(JSON.parse(storedCollapsed));

    const storedCats = localStorage.getItem("unified-sidebar-categories");
    if (storedCats !== null) {
      setOpenCategories(JSON.parse(storedCats));
    } else {
      const defaults: Record<string, boolean> = {};
      NAV_ITEMS.forEach((item) => {
        if (item.type === "category") defaults[item.id] = true;
      });
      setOpenCategories(defaults);
    }
    setMounted(true);
  }, []);

  if (pathname === "/game" || pathname.startsWith("/game/") || pathname === "/fenix-lab" || pathname.startsWith("/fenix-lab/")) {
    return null;
  }

  if (!mounted) return null;

  const handleToggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("unified-sidebar-collapsed", JSON.stringify(next));
  };

  const handleToggleCategory = (id: string) => {
    const next = { ...openCategories, [id]: !openCategories[id] };
    setOpenCategories(next);
    localStorage.setItem("unified-sidebar-categories", JSON.stringify(next));
  };

  const isActive = (href: string) => {
    if (href === "/game") return pathname === "/game" || pathname.startsWith("/game/");
    const base = href.split("?")[0];
    return pathname === base || pathname.startsWith(base + "/");
  };

  return (
    <aside
      className={`flex flex-col h-screen bg-bg-deep border-r border-border transition-all duration-300 ease-out flex-shrink-0 ${
        collapsed ? "w-14" : "w-[240px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center h-14 px-3 border-b border-border flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img src="/logo-fenix-lab-square.png" alt="Fenix Lab" className="w-7 h-7 rounded-[var(--radius-sm)] bg-white p-1 object-contain flex-shrink-0" />
            <span className="text-white text-sm font-semibold font-display truncate">Fenix Lab</span>
          </div>
        )}
        <button
          onClick={handleToggleSidebar}
          className={`${collapsed ? "mx-auto p-0" : "p-1.5"} rounded-[var(--radius-sm)] hover:bg-surface text-text-secondary hover:text-white transition-colors flex-shrink-0`}
          title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? (
            <img src="/logo-fenix-lab-square.png" alt="Fenix Lab" className="w-7 h-7 rounded-[var(--radius-sm)] bg-white p-1 object-contain" />
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              menu_open
            </span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((entry) => {
          if (entry.type === "item") {
            const active = isActive(entry.href);
            return (
              <Link
                key={entry.id}
                href={entry.href}
                title={collapsed ? entry.label : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors group relative ${
                  active
                    ? "bg-primary text-white shadow-[var(--shadow-brand)]"
                    : "text-text-secondary hover:bg-surface hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: "18px" }}>
                  {entry.icon}
                </span>
                {!collapsed && (
                  <span className="text-sm truncate">{entry.label}</span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-surface-raised text-white text-xs rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-border">
                    {entry.label}
                  </div>
                )}
              </Link>
            );
          }

          if (entry.type === "category") {
            const isOpen = openCategories[entry.id] ?? true;
            return (
              <div key={entry.id} className="mt-1">
                {!collapsed ? (
                  <>
                    <button
                      onClick={() => handleToggleCategory(entry.id)}
                      className="w-full flex items-center gap-1 px-2 py-1.5 text-text-muted hover:text-text-secondary transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                        {isOpen ? "expand_more" : "chevron_right"}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider">{entry.label}</span>
                    </button>
                    {isOpen && (
                      <div className="space-y-0.5 mb-1">
                        {entry.items.map((item) => {
                          const active = isActive(item.href);
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${
                                active
                                  ? "bg-primary text-white shadow-[var(--shadow-brand)]"
                                  : "text-text-secondary hover:bg-surface hover:text-white"
                              }`}
                            >
                              <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: "16px" }}>
                                {item.icon}
                              </span>
                              <span className="text-sm truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-0.5 mb-1">
                    {entry.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          title={item.label}
                          className={`flex items-center justify-center px-2.5 py-2 rounded-lg transition-colors group relative ${
                            active
                              ? "bg-primary text-white shadow-[var(--shadow-brand)]"
                              : "text-text-secondary hover:bg-surface hover:text-white"
                          }`}
                        >
                          <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: "18px" }}>
                            {item.icon}
                          </span>
                          <div className="absolute left-full ml-2 px-2 py-1 bg-surface-raised text-white text-xs rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-border">
                            {item.label}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 flex-shrink-0">
        <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">DA</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">Dante</p>
              <p className="text-xs text-text-muted truncate">Administrador</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
