import type { Metadata } from "next";
import ActivateForm from "./activar-form";

export const metadata: Metadata = {
  title: "Activar cuenta · Panel Dos&Go",
  robots: { index: false, follow: false },
};

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-gray-900">Activa tu cuenta</h1>
            <p className="text-sm text-gray-500 mt-1">
              Crea tu contraseña para acceder al panel
            </p>
          </div>

          {token ? (
            <ActivateForm token={token} />
          ) : (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
              Enlace de activación no válido. Solicita un nuevo enlace.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
