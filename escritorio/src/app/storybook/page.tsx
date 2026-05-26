"use client";

import React from "react";

export default function StorybookPage() {
  return (
    <div className="flex flex-col h-full w-full bg-bg">
      <div className="p-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Design System & Storybook</h1>
          <p className="text-xs text-text-secondary">Componentes oficiais da Fenix Lab.</p>
        </div>
        <a 
          href="/storybook/index.html" 
          target="_blank" 
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-[var(--radius-md)] transition-colors"
        >
          Abrir em Nova Aba
        </a>
      </div>
      <div className="flex-1 w-full relative">
        <iframe 
          src="/storybook/index.html" 
          className="absolute inset-0 w-full h-full border-0"
          title="Fenix Lab Storybook"
        />
      </div>
    </div>
  );
}
