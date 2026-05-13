type Primitive = string | number | boolean | null;

interface SelectOptions {
  select?: string;
  filters?: string[];
  order?: string;
  pageSize?: number;
}

interface UpsertOptions {
  onConflict: string;
}

function getEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export function getLibrarySupabaseConfig() {
  const url =
    getEnv("LIBRARY_SUPABASE_URL") ||
    getEnv("SUPABASE_URL");
  const key =
    getEnv("LIBRARY_SUPABASE_KEY") ||
    getEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    getEnv("SUPABASE_SERVICE_KEY") ||
    getEnv("SUPABASE_ANON_KEY") ||
    getEnv("SUPABASE_KEY");

  return { url, key };
}

export class SupabaseRestClient {
  constructor(
    private readonly url: string,
    private readonly key: string,
  ) {}

  private buildHeaders(extra: Record<string, string> = {}) {
    return {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }

  private buildTableUrl(table: string, options?: SelectOptions) {
    const query = new URLSearchParams();
    query.set("select", options?.select || "*");
    for (const filter of options?.filters ?? []) {
      const [field, value] = filter.split("=", 2);
      if (field && value !== undefined) query.append(field, value);
    }
    if (options?.order) query.set("order", options.order);
    return `${this.url.replace(/\/$/, "")}/rest/v1/${table}?${query.toString()}`;
  }

  async selectAll<T>(table: string, options: SelectOptions = {}) {
    const pageSize = options.pageSize ?? 1000;
    let from = 0;
    const results: T[] = [];

    while (true) {
      const res = await fetch(this.buildTableUrl(table, options), {
        headers: this.buildHeaders({
          Range: `${from}-${from + pageSize - 1}`,
          Prefer: "count=exact",
        }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(`Supabase select failed for ${table}: ${message}`);
      }

      const rows = (await res.json()) as T[];
      results.push(...rows);

      if (rows.length < pageSize) break;
      from += pageSize;
    }

    return results;
  }

  async maybeSelectAll<T>(table: string, options: SelectOptions = {}) {
    try {
      return await this.selectAll<T>(table, options);
    } catch (error) {
      const message = String(error);
      if (message.includes("42P01") || message.includes("relation") || message.includes("does not exist")) {
        return [] as T[];
      }
      throw error;
    }
  }

  async upsert<T extends Record<string, Primitive | Primitive[] | Record<string, unknown> | unknown>>(
    table: string,
    rows: T[],
    options: UpsertOptions,
  ) {
    if (!rows.length) return [] as T[];
    const url = `${this.url.replace(/\/$/, "")}/rest/v1/${table}?on_conflict=${encodeURIComponent(options.onConflict)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.buildHeaders({
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(`Supabase upsert failed for ${table}: ${message}`);
    }

    return (await res.json()) as T[];
  }

  async insert<T extends Record<string, unknown>>(table: string, rows: T[]) {
    if (!rows.length) return [] as T[];
    const url = `${this.url.replace(/\/$/, "")}/rest/v1/${table}`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.buildHeaders({
        Prefer: "return=representation",
      }),
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(`Supabase insert failed for ${table}: ${message}`);
    }

    return (await res.json()) as T[];
  }
}

export function createSupabaseRestClientFromEnv() {
  const { url, key } = getLibrarySupabaseConfig();
  if (!url || !key) return null;
  return new SupabaseRestClient(url, key);
}
