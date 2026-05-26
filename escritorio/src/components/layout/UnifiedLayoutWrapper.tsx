"use client";

import React from "react";
import { usePathname } from "next/navigation";
import UnifiedSidebar from "./UnifiedSidebar";

export default function UnifiedLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isHiddenPage = pathname === "/auth" || pathname === "/" || pathname === "/login";
  const isOfficeSurface = pathname === "/game" || pathname.startsWith("/game/");
  const isFenixShell = pathname === "/fenix-lab" || pathname.startsWith("/fenix-lab/");

  if (isHiddenPage) {
    return <div className="flex-1 overflow-auto">{children}</div>;
  }

  if (isOfficeSurface || isFenixShell) {
    return (
      <main className="h-screen w-full overflow-hidden bg-bg">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <UnifiedSidebar />
      <main
        className="relative flex-1 h-screen overflow-hidden"
        style={{ transform: "translateZ(0)" }}
      >
        {children}
      </main>
    </div>
  );
}
