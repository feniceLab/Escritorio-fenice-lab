// src/lib/meta/types.ts
// Tipos compartilhados pelo SDK Meta (Facebook + Instagram).

export type MetaPlatform = "facebook" | "instagram";

export interface MetaPublishResult {
  platform: MetaPlatform;
  success: boolean;
  externalPostId?: string;
  errorMessage?: string;
}

export interface MetaClientConfig {
  accessToken: string;
  fbPageId?: string | null;
  igUserId?: string | null;
}

export interface PublishPayload {
  caption: string;
  imageUrls: string[];
  platform: "facebook" | "instagram" | "both";
  config: MetaClientConfig;
}

export interface MetaFetchOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
  token: string;
}
