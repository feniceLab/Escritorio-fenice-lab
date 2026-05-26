"use client";

import { X, ExternalLink, BookOpen } from "lucide-react";
import { useEffect } from "react";

/**
 * Modal fullscreen que embute o Storybook do Design System Starkën.
 *
 * Em produção: serve /storybook/index.html (build estático em escritorio/public/storybook/)
 * Em dev local: pode apontar para http://localhost:6006 via ?dev=1 na URL
 */
export default function StorybookModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  // Usa build estático em /public/storybook/ por padrão.
  // Dev: set localStorage "storybook.dev" = "1" → usa :6006 com hot-reload.
  const useDev = typeof window !== "undefined" && window.localStorage?.getItem("storybook.dev") === "1";
  const src = useDev ? "http://localhost:6006/" : "/storybook/index.html";

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border">
        <div className="flex items-center gap-2 text-text-primary">
          <BookOpen className="w-4 h-4 text-violet-300" />
          <span className="text-body font-semibold">Design System Starkën</span>
          {useDev && (
            <span className="text-micro px-2 py-0.5 bg-amber-500/20 text-amber-200 rounded-full">DEV :6006</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-caption text-text-secondary"
          >
            <ExternalLink className="w-3 h-3" />
            Abrir em nova aba
          </a>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-caption text-text-secondary"
          >
            <X className="w-3 h-3" />
            Fechar
          </button>
        </div>
      </div>
      <iframe
        src={src}
        className="flex-1 w-full border-0 bg-white"
        title="Storybook Starkën"
      />
    </div>
  );
}
