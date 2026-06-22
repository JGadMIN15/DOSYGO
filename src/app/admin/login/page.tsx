import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Acceso · Panel Dos&Go",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // Already signed in? Skip the form.
  if (await getAdminSession()) redirect("/admin");

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-gray-900">Panel de administración</h1>
            <p className="text-sm text-gray-500 mt-1">Acceso restringido al equipo</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
