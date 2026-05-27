// src/lib/meta/facebook.ts
// Publicação em Facebook Page (texto, single image ou carrossel via attached_media).

import { metaFetch } from "./client";
import type { MetaPublishResult } from "./types";

interface PhotoUploadResponse {
  id: string;
  post_id?: string;
}

interface FeedPostResponse {
  id: string;
}

async function uploadUnpublishedPhoto(
  pageId: string,
  token: string,
  imageUrl: string,
): Promise<string> {
  const res = await metaFetch<PhotoUploadResponse>(`/${pageId}/photos`, {
    method: "POST",
    token,
    body: { url: imageUrl, published: false },
  });
  return res.id;
}

export async function publishFacebookPost(
  pageId: string,
  token: string,
  caption: string,
  imageUrls: string[],
): Promise<MetaPublishResult> {
  try {
    if (!pageId) {
      return {
        platform: "facebook",
        success: false,
        errorMessage: "fb_page_id_missing",
      };
    }

    // 0 imagens — texto puro
    if (!imageUrls || imageUrls.length === 0) {
      const res = await metaFetch<FeedPostResponse>(`/${pageId}/feed`, {
        method: "POST",
        token,
        body: { message: caption },
      });
      return {
        platform: "facebook",
        success: true,
        externalPostId: res.id,
      };
    }

    // 1 imagem
    if (imageUrls.length === 1) {
      const res = await metaFetch<PhotoUploadResponse>(`/${pageId}/photos`, {
        method: "POST",
        token,
        body: { url: imageUrls[0], message: caption },
      });
      const externalId = res.post_id ?? res.id;
      return {
        platform: "facebook",
        success: true,
        externalPostId: externalId,
      };
    }

    // N imagens — sobe cada photo como unpublished e usa attached_media
    const mediaIds = await Promise.all(
      imageUrls.map((url) => uploadUnpublishedPhoto(pageId, token, url)),
    );
    const attachedMedia = mediaIds.map((mid) => ({ media_fbid: mid }));

    const feed = await metaFetch<FeedPostResponse>(`/${pageId}/feed`, {
      method: "POST",
      token,
      body: {
        message: caption,
        attached_media: attachedMedia,
      },
    });

    return {
      platform: "facebook",
      success: true,
      externalPostId: feed.id,
    };
  } catch (err) {
    return {
      platform: "facebook",
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
