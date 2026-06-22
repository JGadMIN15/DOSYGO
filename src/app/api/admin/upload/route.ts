import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { getAdminSession } from "@/lib/admin-session";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export async function POST(req: NextRequest) {
  // Server-side authz (in addition to the proxy guard).
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Formato no permitido (usa jpg, png, webp o avif)" },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera los 5 MB" }, { status: 413 });
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const key = `productos/${randomUUID()}.${ext}`;

  // On Vercel, a Blob store connected via OIDC authenticates automatically (no
  // static token needed). If BLOB_READ_WRITE_TOKEN is set, use it instead.
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    const blob = await put(key, file, {
      access: "public",
      contentType: file.type,
      ...(token ? { token } : {}),
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Blob upload error:", err);
    return NextResponse.json(
      {
        error:
          "No se pudo subir la imagen. Si el problema persiste, usa el campo de URL de imagen.",
      },
      { status: 500 }
    );
  }
}
