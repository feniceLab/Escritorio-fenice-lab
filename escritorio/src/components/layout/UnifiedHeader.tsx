"use client";

import React from "react";
import { Bell, Search } from "lucide-react";

export default function UnifiedHeader() {
  return (
    <header className="h-16 bg-bg-deep/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <img src="/logo-fenix-lab-square.png" alt="Fenix Lab" className="h-8 w-8 rounded-[var(--radius-sm)] bg-white p-1 object-contain" />
          <div className="flex flex-col leading-none border-l border-border pl-3">
            <span className="text-lg font-black text-white font-display uppercase">Fenix Lab</span>
            <span className="text-[10px] font-bold text-primary tracking-[0.2em] mt-0.5 uppercase">Tecnologia</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center bg-surface/70 border border-border rounded-full px-4 py-1.5 w-64 group focus-within:border-primary/50 transition-all">
          <Search className="w-4 h-4 text-text-muted group-focus-within:text-primary" />
          <input 
            type="text" 
            placeholder="Buscar no sistema..." 
            className="bg-transparent border-0 text-sm text-text-secondary focus:ring-0 placeholder:text-text-muted w-full ml-2"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-surface/40 rounded-[var(--radius-md)] p-1 mr-4">
          <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-[var(--radius-sm)] uppercase tracking-wider">Sistema Unificado v1.0</div>
        </div>

        <button className="p-2 text-text-secondary hover:text-white transition-colors relative hover:bg-surface rounded-[var(--radius-md)]">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-bg-deep"></span>
        </button>
        
        <div className="h-6 w-[1px] bg-border mx-2"></div>
        
        <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-surface transition-colors group">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-xs font-bold text-white">Fenix Lab Admin</span>
            <span className="text-[10px] text-text-muted">Administrador</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/10">
            SA
          </div>
        </button>
      </div>
    </header>
  );
}
