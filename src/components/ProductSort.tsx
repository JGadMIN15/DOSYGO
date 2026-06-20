"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "destacado",   label: "Relevancia" },
  { value: "nuevo",       label: "Más recientes" },
  { value: "precio-asc",  label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
];

export default function ProductSort({ current }: { current?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === "destacado") {
      params.delete("orden");
    } else {
      params.set("orden", e.target.value);
    }
    router.push(`/productos?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Ordenar por</span>
      <select
        value={current ?? "destacado"}
        onChange={handleChange}
        className="text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-red-400 cursor-pointer"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
