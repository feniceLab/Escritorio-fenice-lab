"use client";

import { forwardRef } from "react";
import type { ReactNode, ButtonHTMLAttributes } from "react";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: "border-transparent text-white shadow-[var(--shadow-brand)] bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-secondary))] hover:brightness-110",
  secondary: "bg-transparent text-primary border-primary/40 hover:bg-primary/10 hover:border-primary",
  danger: "bg-danger/15 text-red-300 border-danger/30 hover:bg-danger/25 hover:border-danger",
  ghost: "bg-transparent text-text-secondary border-white/10 hover:bg-white/5 hover:text-text hover:border-white/20",
};

const SIZE_CLASSES: Record<string, string> = {
  sm: "min-h-8 px-3 py-1.5 text-xs rounded-[var(--radius-sm)] gap-1",
  md: "min-h-10 px-5 py-2.5 text-sm rounded-[var(--radius-md)] gap-2",
  lg: "min-h-12 px-7 py-3.5 text-base rounded-[var(--radius-lg)] gap-2",
};

const ICON_SIZE: Record<string, string> = {
  sm: "w-3 h-3",
  md: "w-3.5 h-3.5",
  lg: "w-4 h-4",
};

const ICON_ONLY_SIZE: Record<string, string> = {
  sm: "min-h-8 min-w-8 p-1.5 rounded-[var(--radius-sm)]",
  md: "min-h-10 min-w-10 p-2 rounded-[var(--radius-md)]",
  lg: "min-h-12 min-w-12 p-2.5 rounded-[var(--radius-lg)]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", icon, loading, disabled, children, className = "", ...rest }, ref) => {
    const isDisabled = disabled || loading;
    const iconOnly = !children && (icon || loading);

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center border font-semibold leading-none whitespace-nowrap transition-all
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg
          ${VARIANT_CLASSES[variant]}
          ${iconOnly ? ICON_ONLY_SIZE[size] : SIZE_CLASSES[size]}
          ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `.trim().replace(/\s+/g, " ")}
        {...rest}
      >
        {loading ? (
          <span className={`${ICON_SIZE[size]} animate-spin border-2 border-current border-t-transparent rounded-full`} />
        ) : icon ? (
          <span className={ICON_SIZE[size]}>{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export default Button;
