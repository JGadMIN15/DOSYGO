"use client";

import { useToastStore } from "@/lib/toast";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

const STYLE = {
  success: { color: "#16a34a", Icon: CheckCircle },
  error: { color: "#e31e24", Icon: AlertCircle },
  info: { color: "#c9a96e", Icon: Info },
} as const;

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const { color, Icon } = STYLE[t.type];
        return (
          <div
            key={t.id}
            className="toast-in pointer-events-auto w-full flex items-center gap-3 rounded-xl px-4 py-3 shadow-2xl border border-white/10"
            style={{ background: "linear-gradient(180deg,#17171d,#0d0d12)" }}
          >
            <Icon className="w-5 h-5 flex-shrink-0" style={{ color }} />
            <span className="flex-1 text-sm text-white leading-snug">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Cerrar" className="text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
