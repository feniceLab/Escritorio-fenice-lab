// src/components/metrics/PublishCalendar.tsx
"use client";

type DayStatus = "published" | "scheduled" | "none";

type Props = {
  publishedDates: string[];
  scheduledDates?: string[];
  months?: number;
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function PublishCalendar({ publishedDates, scheduledDates = [], months = 3 }: Props) {
  const publishedSet = new Set(publishedDates.map((d) => d.slice(0, 10)));
  const scheduledSet = new Set(scheduledDates.map((d) => d.slice(0, 10)));

  const today = new Date();
  const monthsToShow: Array<{ year: number; month: number; name: string }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthsToShow.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      name: d.toLocaleString("pt-BR", { month: "long", year: "numeric" }),
    });
  }

  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Calendário de publicações</h3>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-success inline-block" />
            Publicado
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-warning inline-block" />
            Agendado
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {monthsToShow.map(({ year, month, name }) => {
          const daysInMonth = getDaysInMonth(year, month);
          const firstDay = getFirstDayOfMonth(year, month);
          const cells: Array<{ day: number | null; status: DayStatus }> = [];

          for (let i = 0; i < firstDay; i++) cells.push({ day: null, status: "none" });

          for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const status: DayStatus = publishedSet.has(dateStr)
              ? "published"
              : scheduledSet.has(dateStr)
              ? "scheduled"
              : "none";
            cells.push({ day: d, status });
          }

          return (
            <div key={`${year}-${month}`}>
              <p className="mb-2 text-xs font-medium capitalize text-text-muted">{name}</p>
              <div className="grid grid-cols-7 gap-0.5">
                {weekDays.map((wd, i) => (
                  <div key={i} className="text-center text-[10px] text-text-muted py-0.5">
                    {wd}
                  </div>
                ))}
                {cells.map((cell, i) => (
                  <div
                    key={i}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] mx-auto ${
                      cell.day === null
                        ? ""
                        : cell.status === "published"
                        ? "bg-success text-white font-medium"
                        : cell.status === "scheduled"
                        ? "bg-warning/80 text-white font-medium"
                        : "text-text-muted hover:bg-surface-raised"
                    }`}
                  >
                    {cell.day ?? ""}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PublishCalendar;
