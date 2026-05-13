export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/['".]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeKey(value: string | null | undefined) {
  return slugify(value ?? "");
}

export function decodeSqlString(value: string) {
  return value.replace(/''/g, "'");
}

export function titleCasePt(value: string) {
  const lowerWords = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "em", "com"]);
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part, index) => {
      if (index > 0 && lowerWords.has(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

export function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => (value ?? "").trim()).filter(Boolean))];
}

export function inferMediaKind(input: string | null | undefined) {
  const value = (input ?? "").toLowerCase();
  if (!value) return "other";
  if (/\.(png|jpg|jpeg|webp|gif|svg)(\?|$)/.test(value) || value.startsWith("image/")) return "image";
  if (/\.(mp4|mov|avi|webm|mkv|m4v)(\?|$)/.test(value) || value.startsWith("video/")) return "video";
  if (/\.(pdf)(\?|$)/.test(value) || value.includes("application/pdf")) return "pdf";
  if (/\.(doc|docx|txt|md|ppt|pptx|xls|xlsx)(\?|$)/.test(value)) return "document";
  return "other";
}

export function parseImageUrlField(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.map((entry) => String(entry)).filter(Boolean) : [trimmed];
      } catch {
        return [trimmed];
      }
    }
    return [trimmed];
  }
  return [];
}
