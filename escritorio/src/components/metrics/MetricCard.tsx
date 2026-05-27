// src/components/metrics/MetricCard.tsx
import { TrendingDown, TrendingUp } from "lucide-react";

type Props = {
  label: string;
  value: number;
  change?: number;
  icon?: string;
};

function formatValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

const METRIC_LABELS: Record<string, string> = {
  fb_impressions: "Impressões FB",
  fb_engaged_users: "Engajamento FB",
  fb_reactions_like_total: "Curtidas FB",
  ig_reach: "Alcance IG",
  ig_saved: "Salvamentos IG",
  ig_likes: "Curtidas IG",
};

const METRIC_ICONS: Record<string, string> = {
  fb_impressions: "📊",
  fb_engaged_users: "👥",
  fb_reactions_like_total: "👍",
  ig_reach: "📡",
  ig_saved: "🔖",
  ig_likes: "❤️",
};

export function MetricCard({ label, value, change, icon }: Props) {
  const displayLabel = METRIC_LABELS[label] ?? label;
  const displayIcon = icon ?? METRIC_ICONS[label] ?? "📈";
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-text-muted">{displayIcon} {displayLabel}</span>
        {change !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              isPositive ? "text-success" : "text-danger"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold">{formatValue(value)}</p>
      {change !== undefined && (
        <p className="mt-1 text-xs text-text-muted">vs período anterior</p>
      )}
    </div>
  );
}

export default MetricCard;
