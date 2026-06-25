"use client";

import { useActionState, useRef, useState } from "react";
import type { ActionState } from "@/app/admin/actions";

export interface ProductInit {
  id?: string;
  name?: string;
  brand?: string;
  category?: string;
  description?: string;
  price?: number;
  stock?: number;
  featured?: boolean;
  images?: string[];
  availableUntil?: string; // YYYY-MM-DD
}

const initialState: ActionState = {};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

export default function ProductForm({
  action,
  submitLabel,
  product,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  product?: ProductInit;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error al subir la imagen");
        uploaded.push(data.url as string);
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, 10));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  function addImageUrl() {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https:\/\//i.test(url) && !url.startsWith("/productos/")) {
      setUploadError("La URL debe empezar por https://");
      return;
    }
    setUploadError(null);
    setImages((prev) => (prev.length >= 10 ? prev : [...prev, url]));
    setUrlInput("");
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {product?.id && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      {state.error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del producto
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={200}
          defaultValue={product?.name}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
            Marca
          </label>
          <input
            id="brand"
            name="brand"
            type="text"
            required
            maxLength={100}
            defaultValue={product?.brand}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <input
            id="category"
            name="category"
            type="text"
            required
            maxLength={100}
            defaultValue={product?.category}
            className={inputClass}
            placeholder="Cronógrafos, Deportivos…"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={5000}
          rows={5}
          defaultValue={product?.description}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Precio (€)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={product?.price !== undefined ? product.price / 100 : undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
            Stock
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.stock ?? 0}
            className={inputClass}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-gray-700 pb-2.5">
            <input
              name="featured"
              type="checkbox"
              defaultChecked={product?.featured}
              className="h-4 w-4 rounded border-gray-300"
            />
            Destacado
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="availableUntil" className="block text-sm font-medium text-gray-700 mb-1">
          Disponible hasta <span className="font-normal text-gray-400">(opcional)</span>
        </label>
        <input
          id="availableUntil"
          name="availableUntil"
          type="date"
          defaultValue={product?.availableUntil}
          className={inputClass}
        />
        <p className="text-xs text-gray-400 mt-1">
          Si pones una fecha, el producto se retira de la tienda automáticamente
          al terminar ese día. Déjalo vacío para que esté siempre disponible.
        </p>
      </div>

      {/* Image uploader */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Imágenes ({images.length}/10)
        </label>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="w-20 h-20 rounded-lg object-cover border border-gray-200 bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-900 text-white text-xs leading-none"
                  aria-label="Quitar imagen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading || images.length >= 10}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white disabled:opacity-60"
        />
        {uploading && <p className="text-xs text-gray-500 mt-1">Subiendo…</p>}
        {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
        <p className="text-xs text-gray-400 mt-1">
          JPG, PNG, WEBP o AVIF · máx. 5 MB por imagen.
        </p>

        <div className="mt-3 flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addImageUrl();
              }
            }}
            placeholder="…o pega la URL de una imagen (https://…)"
            className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
          <button
            type="button"
            onClick={addImageUrl}
            disabled={images.length >= 10}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Añadir
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          ¿La subida de archivos no funciona todavía? Pega aquí el enlace de una
          imagen ya alojada en internet (debe empezar por https://).
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "var(--brand, #dc2626)" }}
        >
          {pending ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
