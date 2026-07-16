"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerCustomer, loginCustomer } from "./actions";

export default function AuthForm({ mode }: { mode: "register" | "login" }) {
  const isRegister = mode === "register";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = isRegister
        ? await registerCustomer({ username, email, name, password })
        : await loginCustomer({ username, password });
      if (res.ok) {
        router.push("/cuenta");
        router.refresh();
      } else {
        setError(res.error ?? "Ha ocurrido un error.");
      }
    });
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-white/30";

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Nombre de usuario"
        autoComplete="username"
        required
        className={input}
      />
      {isRegister && (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
            className={input}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre (opcional)"
            autoComplete="name"
            className={input}
          />
        </>
      )}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        autoComplete={isRegister ? "new-password" : "current-password"}
        required
        className={input}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl py-3 text-white text-sm font-bold uppercase tracking-wide disabled:opacity-50"
        style={{ background: "linear-gradient(90deg, var(--brand), var(--brand-dark))" }}
      >
        {pending ? "Un momento…" : isRegister ? "Crear cuenta" : "Entrar"}
      </button>

      <p className="text-xs text-gray-400 text-center pt-1">
        {isRegister ? (
          <>¿Ya tienes cuenta? <Link href="/cuenta/entrar" className="text-gold underline">Entra</Link></>
        ) : (
          <>¿Nuevo por aquí? <Link href="/cuenta/registro" className="text-gold underline">Crea tu cuenta</Link></>
        )}
      </p>
    </form>
  );
}
