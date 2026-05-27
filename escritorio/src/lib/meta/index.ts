// src/lib/meta/index.ts
// Orquestra publicação em Facebook e/ou Instagram com base no PublishPayload.

import { publishFacebookPost } from "./facebook";
import { publishInstagram } from "./instagram";
import type { MetaPublishResult, PublishPayload } from "./types";

export * from "./types";
export { metaFetch, MetaApiError } from "./client";
export { publishFacebookPost } from "./facebook";
export { publishInstagram } from "./instagram";

export async function publishContent(
  payload: PublishPayload,
): Promise<MetaPublishResult[]> {
  const { caption, imageUrls, platform, config } = payload;
  const { accessToken, fbPageId, igUserId } = config;

  const targets: Array<"facebook" | "instagram"> =
    platform === "both" ? ["facebook", "instagram"] : [platform];

  const results: MetaPublishResult[] = [];

  for (const target of targets) {
    if (target === "facebook") {
      if (!fbPageId) {
        results.push({
          platform: "facebook",
          success: false,
          errorMessage: "fb_page_id_missing",
        });
        continue;
      }
      results.push(
        await publishFacebookPost(fbPageId, accessToken, caption, imageUrls),
      );
    } else if (target === "instagram") {
      if (!igUserId) {
        results.push({
          platform: "instagram",
          success: false,
          errorMessage: "ig_user_id_missing",
        });
        continue;
      }
      results.push(
        await publishInstagram(igUserId, accessToken, caption, imageUrls),
      );
    }
  }

  return results;
}
