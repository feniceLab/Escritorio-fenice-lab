// src/app/api/clients/[clientId]/media/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, officeClients } from "@/db";
import { getUserId } from "@/lib/internal-rpc";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function extensionFor(name: string, mime: string): string {
  const dot = name.lastIndexOf(".");
  if (dot > -1 && dot < name.length - 1) {
    return name.slice(dot + 1).toLowerCase();
  }
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };
  return map[mime] ?? "bin";
}

function safeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { clientId } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "office-media";

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "supabase_not_configured" },
      { status: 500 },
    );
  }

  try {
    const [client] = await db
      .select({ id: officeClients.id })
      .from(officeClients)
      .where(eq(officeClients.id, clientId))
      .limit(1);
    if (!client) {
      return NextResponse.json({ error: "client_not_found" }, { status: 404 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }

    const fileName =
      (file as File).name && typeof (file as File).name === "string"
        ? (file as File).name
        : "upload";
    const mimeType = file.type || "application/octet-stream";

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    }

    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json(
        { error: "unsupported_mime_type", mime: mimeType },
        { status: 415 },
      );
    }

    const ext = extensionFor(fileName, mimeType);
    const baseName = safeSlug(fileName.replace(/\.[^.]+$/, "")) || "media";
    const objectName = `${clientId}/${Date.now()}-${randomUUID().slice(0, 8)}-${baseName}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();

    const uploadUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${bucket}/${objectName}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": mimeType,
        "x-upsert": "false",
        "cache-control": "3600",
      },
      body: arrayBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => "");
      console.error("Supabase upload failed:", uploadResponse.status, errorText);
      return NextResponse.json(
        { error: "upload_failed", details: errorText.slice(0, 500) },
        { status: 502 },
      );
    }

    const publicUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${objectName}`;

    return NextResponse.json({
      url: publicUrl,
      path: objectName,
      bucket,
      mimeType,
      size: file.size,
    });
  } catch (error) {
    console.error("Failed to upload media:", error);
    return NextResponse.json(
      { error: "failed_to_upload_media" },
      { status: 500 },
    );
  }
}

// Disable Next.js body parsing limit (Next App Router supports streaming form data)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
