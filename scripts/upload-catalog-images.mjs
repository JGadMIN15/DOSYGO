// Upload the catalogue photos (imagenes/<SKU>.jpg|png) to Vercel Blob and write
// a SKU -> URL map to src/data/catalog-images.json, which the app reads via
// catalogImageUrl(). Keeps ~400 MB of images out of git.
//
// Usage (from the project root, with BLOB_READ_WRITE_TOKEN in .env or the env):
//   node scripts/upload-catalog-images.mjs ["C:\\ruta\\a\\imagenes"]
//
// Resumable & idempotent: already-mapped SKUs are skipped; the map is saved
// every 50 uploads, so you can stop and re-run.

import { put } from "@vercel/blob";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IMG_DIR = process.argv[2] || "C:\\Users\\david\\Downloads\\Catalogo_Web\\imagenes";
const MAP_PATH = path.join(ROOT, "src", "data", "catalog-images.json");
const CONCURRENCY = 8;

function loadToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN.trim();
  try {
    const env = readFileSync(path.join(ROOT, ".env"), "utf8");
    const m = env.match(/^\s*BLOB_READ_WRITE_TOKEN\s*=\s*"?([^"\r\n]+)"?/m);
    if (m && m[1].trim()) return m[1].trim();
  } catch {}
  return null;
}

const token = loadToken();
if (!token) {
  console.error("✗ Falta BLOB_READ_WRITE_TOKEN (ponlo en .env o en el entorno).");
  console.error("  Consíguelo en Vercel → Storage → tu Blob store → .env.local.");
  process.exit(1);
}
if (!existsSync(IMG_DIR)) {
  console.error(`✗ No existe la carpeta de imágenes: ${IMG_DIR}`);
  process.exit(1);
}

const map = existsSync(MAP_PATH) ? JSON.parse(readFileSync(MAP_PATH, "utf8")) : {};
const IMG_RE = /\.(jpe?g|png)$/i;
const files = readdirSync(IMG_DIR).filter((f) => IMG_RE.test(f));
const skuOf = (f) => f.replace(IMG_RE, "");
const ctOf = (f) => (/\.png$/i.test(f) ? "image/png" : "image/jpeg");

const todo = files.filter((f) => !map[skuOf(f)]);
console.log(`Imágenes: ${files.length} · ya subidas: ${files.length - todo.length} · pendientes: ${todo.length}`);

function saveMap() {
  const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MAP_PATH, JSON.stringify(sorted, null, 0) + "\n", "utf8");
}

let done = 0;
let failed = 0;
let cursor = 0;

async function worker() {
  while (cursor < todo.length) {
    const file = todo[cursor++];
    const sku = skuOf(file);
    const ext = path.extname(file).toLowerCase();
    try {
      const body = readFileSync(path.join(IMG_DIR, file));
      const { url } = await put(`catalogo/${sku}${ext}`, body, {
        access: "public",
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: ctOf(file),
      });
      map[sku] = url;
      done++;
      if (done % 50 === 0) {
        saveMap();
        console.log(`  ${done}/${todo.length} subidas…`);
      }
    } catch (err) {
      failed++;
      console.error(`  ✗ ${file}: ${err?.message ?? err}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
saveMap();
console.log(`✓ Listo. Subidas: ${done} · fallidas: ${failed} · total en el mapa: ${Object.keys(map).length}`);
console.log("Ahora haz commit de src/data/catalog-images.json y push.");
