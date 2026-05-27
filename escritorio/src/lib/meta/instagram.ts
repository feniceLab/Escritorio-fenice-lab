// src/lib/meta/instagram.ts
// Publicação em Instagram (single image ou carrossel) via Graph API.

import { metaFetch } from "./client";
import type { MetaPublishResult } from "./types";

interface ContainerResponse {
  id: string;
}

interface ContainerStatus {
  status_code: "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED" | "PUBLISHED";
  status?: string;
}

interface PublishResponse {
  id: string;
}

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000;

async function pollContainer(
  containerId: string,
  token: string,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const status = await metaFetch<ContainerStatus>(`/${containerId}`, {
      method: "GET",
      token,
      body: { fields: "status_code,status" },
    });
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new Error(
        `Instagram container failed: ${status.status_code} ${status.status ?? ""}`,
      );
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Instagram container timeout (90s)");
}

export async function publishInstagram(
  igUserId: string,
  token: string,
  caption: string,
  imageUrls: string[],
): Promise<MetaPublishResult> {
  try {
    if (!igUserId) {
      return {
        platform: "instagram",
        success: false,
        errorMessage: "ig_user_id_missing",
      };
    }
    if (!imageUrls || imageUrls.length === 0) {
      return {
        platform: "instagram",
        success: false,
        errorMessage: "ig_requires_image",
      };
    }

    let containerId: string;

    if (imageUrls.length === 1) {
      // Single image: cria container direto
      const container = await metaFetch<ContainerResponse>(
        `/${igUserId}/media`,
        {
          method: "POST",
          token,
          body: { image_url: imageUrls[0], caption },
        },
      );
      containerId = container.id;
      await pollContainer(containerId, token);
    } else {
      // Carrossel: criar containers individuais + container carrossel
      const childContainers = await Promise.all(
        imageUrls.map(async (url) => {
          const c = await metaFetch<ContainerResponse>(`/${igUserId}/media`, {
            method: "POST",
            token,
            body: { image_url: url, is_carousel_item: true },
          });
          return c.id;
        }),
      );

      // Poll de cada child container
      await Promise.all(childContainers.map((id) => pollContainer(id, token)));

      const carousel = await metaFetch<ContainerResponse>(
        `/${igUserId}/media`,
        {
          method: "POST",
          token,
          body: {
            media_type: "CAROUSEL",
            children: childContainers.join(","),
            caption,
          },
        },
      );
      containerId = carousel.id;
      await pollContainer(containerId, token);
    }

    const published = await metaFetch<PublishResponse>(
      `/${igUserId}/media_publish`,
      {
        method: "POST",
        token,
        body: { creation_id: containerId },
      },
    );

    return {
      platform: "instagram",
      success: true,
      externalPostId: published.id,
    };
  } catch (err) {
    return {
      platform: "instagram",
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
