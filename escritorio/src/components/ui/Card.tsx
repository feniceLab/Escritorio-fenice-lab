"use client";

import type { ReactNode } from "react";

export interface CardProps {
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

export default function Card({ selectable, selected, onClick, children, className = "" }: CardProps) {
  return (
    <div
      onClick={selectable || onClick ? onClick : undefined}
      className={`
        bg-surface border rounded-[var(--radius-lg)] transition-all shadow-[var(--shadow-sm)]
        ${selected ? "border-primary/50 ring-2 ring-primary/25 bg-primary-muted" : "border-border"}
        ${selectable && !selected ? "hover:border-white/15 hover:shadow-[var(--shadow-md)] cursor-pointer" : ""}
        ${onClick && !selectable ? "cursor-pointer hover:border-primary/50 hover:shadow-[var(--shadow-md)]" : ""}
        ${className}
      `.trim().replace(/\s+/g, " ")}
    >
      {children}
    </div>
  );
}
