import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { getAdminSession } from "@/lib/admin-session";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

type ImageType = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

// Identify the real image type from the file's magic bytes — never trust the
// client-declared Content-Type/extension (which can be spoofed to store
// arbitrary bytes under an image/* type on a public URL).
function sniffImageType(b: Buffer): ImageType | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return "image/png";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP")
    return "image/webp";
  if (b.toString("ascii", 4, 8) === "ftyp") {
    const brand = b.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  return null;
}

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
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera los 5 MB" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) {
    return NextResponse.json(
      { error: "El archivo no es una imagen válida (usa jpg, png, webp o avif)" },
      { status: 415 }
    );
  }

  const ext = type === "image/jpeg" ? "jpg" : type.split("/")[1];
  const key = `productos/${randomUUID()}.${ext}`;

  // On Vercel, a Blob store connected via OIDC authenticates automatically (no
  // static token needed). If BLOB_READ_WRITE_TOKEN is set, use it instead.
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    const blob = await put(key, bytes, {
      access: "public",
      contentType: type,
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
