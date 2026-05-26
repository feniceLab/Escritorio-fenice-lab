import { ReactNode } from "react";
import MarkdownContent from "@/components/ui/MarkdownContent";

export interface ChatBubbleProps {
  sender: "player" | "npc" | "system";
  name?: string;
  streaming?: boolean;
  children: ReactNode;
  timestamp?: number;
  model?: string;
  provider?: string;
}

export default function ChatBubble({ sender, name, streaming, children, timestamp, model, provider }: ChatBubbleProps) {
  if (sender === "system") {
    return (
      <div className="text-center text-text-muted text-caption italic py-1">
        {children}
      </div>
    );
  }

  const isPlayer = sender === "player";
  const isNpc = sender === "npc";

  return (
    <div className={`flex ${isPlayer ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[85%] px-3 py-2 rounded-lg text-body
          ${isPlayer ? "bg-primary text-white" : "bg-surface-raised text-text-secondary"}
        `.trim().replace(/\s+/g, " ")}
      >
        {/* Header - Unified for everyone at the top */}
        {name && (
          <div className="flex items-center gap-2 mb-1.5 leading-none">
            <span className={`text-caption font-bold ${isPlayer ? "text-white" : "text-npc"}`}>{name}</span>
            <div className={`flex items-center gap-1.5 opacity-60 text-[10px] italic tracking-tighter uppercase ${isPlayer ? "text-white" : ""}`}>
              {timestamp && <span>{new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
              {provider && <span className="px-1 rounded bg-black/30 text-[9px] font-bold">{provider}</span>}
              {model && <span className="font-medium">{model}</span>}
            </div>
          </div>
        )}

        {/* Content */}
        {isNpc && typeof children === "string" ? (
          <MarkdownContent content={children} />
        ) : (
          children
        )}
        {streaming && (
          <span className="inline-block w-1.5 h-4 bg-npc ml-0.5 animate-pulse rounded-sm" />
        )}

        {/* Footer - Completely removed as per user request to clean up the bottom */}

      </div>
    </div>
  );
}
