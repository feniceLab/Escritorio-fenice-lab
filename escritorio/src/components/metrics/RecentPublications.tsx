// src/components/metrics/RecentPublications.tsx
"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";

type Publication = {
  id: string;
  platform: string;
  status: string;
  externalPostId?: string | null;
  publishedAt: string;
  contentTitle?: string;
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  published: <CheckCircle2 className="h-4 w-4 text-success" />,
  failed: <XCircle className="h-4 w-4 text-danger" />,
  scheduled: <Clock className="h-4 w-4 text-text-muted" />,
};

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  both: "Ambos",
};

type Props = {
  publications: Publication[];
};

export function RecentPublications({ publications }: Props) {
  if (publications.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-muted">
        Nenhuma publicação encontrada
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">Publicações recentes</h3>
      </div>
      <ul className="divide-y divide-border">
        {publications.slice(0, 10).map((pub) => (
          <li key={pub.id} className="flex items-center gap-3 px-5 py-3">
            <span>{STATUS_ICONS[pub.status] ?? <Clock className="h-4 w-4 text-text-muted" />}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {pub.contentTitle ?? pub.externalPostId ?? pub.id.slice(0, 8)}
              </p>
              <p className="text-xs text-text-muted">
                {PLATFORM_LABELS[pub.platform] ?? pub.platform} ·{" "}
                {new Date(pub.publishedAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <span
              className={`shrink-0 text-xs rounded-full px-2 py-0.5 ${
                pub.status === "published"
                  ? "bg-success/20 text-success"
                  : pub.status === "failed"
                  ? "bg-danger/20 text-danger"
                  : "bg-surface-raised text-text-muted"
              }`}
            >
              {pub.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RecentPublications;
