// Upload product images to Vercel Blob. On Vercel a Blob store connected via
// OIDC authenticates automatically; if BLOB_READ_WRITE_TOKEN is set, it's used.

import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

export async function uploadProductImage(
  bytes: Buffer,
  contentType: string,
  ext: string
): Promise<string> {
  const key = `productos/${randomUUID()}.${ext}`;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const blob = await put(key, bytes, {
    access: "public",
    contentType,
    ...(token ? { token } : {}),
  });
  return blob.url;
}
