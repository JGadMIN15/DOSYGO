export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-session";
import {
  inviteAdmin,
  resetAdminPassword,
  setAdminRole,
  deleteAdmin,
} from "../../actions";
import ChangePasswordForm from "@/app/admin/_components/change-password-form";

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrador" },
  { value: "editor", label: "Editor" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string }>;
}) {
  const session = await requireRole("admin");
  const sp = await searchParams;
  const link = sp.link ?? "";

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Usuarios</h1>
      <p className="text-sm text-gray-500 mb-6">
        Administradores del panel. Solo los <strong>Administradores</strong> pueden
        gestionar usuarios; los <strong>Editores</strong> gestionan catálogo y
        pedidos.
      </p>

      {link && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-800 font-medium mb-1">
            Enlace de activación generado — envíaselo a la persona (válido 7 días):
          </p>
          <code className="block text-xs bg-white border border-green-200 rounded px-3 py-2 break-all">
            {link}
          </code>
        </div>
      )}

      {/* Invitar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Invitar administrador</h2>
        <form action={inviteAdmin} className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs text-gray-500 mb-1">Nombre</label>
            <input
              name="name"
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rol</label>
            <select name="role" defaultValue="editor" className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--brand, #dc2626)" }}
          >
            Invitar
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">
          Se crea la cuenta sin contraseña y se genera un enlace para que la
          persona elija la suya.
        </p>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Usuario</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const isSelf = u.id === session.sub;
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {u.name} {isSelf && <span className="text-xs text-gray-400">(tú)</span>}
                    </div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {u.passwordHash ? (
                      <span className="text-xs text-green-700">Activo</span>
                    ) : (
                      <span className="text-xs text-amber-600">Pendiente de activar</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <form action={setAdminRole} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                        Guardar
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <form action={resetAdminPassword}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                          Restablecer contraseña
                        </button>
                      </form>
                      {!isSelf && (
                        <form action={deleteAdmin}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                            Eliminar
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cambiar mi contraseña */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Cambiar mi contraseña</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
