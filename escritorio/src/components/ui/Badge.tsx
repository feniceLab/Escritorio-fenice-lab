"use client";

import type { ReactNode } from "react";

export interface BadgeProps {
  variant?: "default" | "neutral" | "npc" | "danger" | "success" | "info" | "warning";
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<string, string> = {
  default: "bg-primary/10 text-primary border-primary/30",
  neutral: "bg-slate-500/10 text-text-secondary border-slate-500/30",
  npc: "bg-npc/10 text-amber-300 border-npc/30",
  danger: "bg-danger/15 text-red-300 border-danger/30",
  success: "bg-success/15 text-emerald-300 border-success/30",
  info: "bg-info/15 text-blue-300 border-info/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

const SIZE_CLASSES: Record<string, string> = {
  sm: "text-micro px-1.5 py-0.5",
  md: "text-caption px-2 py-0.5",
};

export default function Badge({ variant = "default", size = "sm", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-bold
        ${VARIANT_CLASSES[variant]}
        ${SIZE_CLASSES[size]}
        ${className}
      `.trim().replace(/\s+/g, " ")}
    >
      {children}
    </span>
  );
}
