// Fase 6 / usuarios: cambio de clave autoservicio (button + panel inline).
"use client";

import { useState } from "react";
import { KeyRound, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CambiarClave({ className = "text-stone-700 hover:bg-stone-100" }: { className?: string }) {
  const [abierto, setAbierto] = useState(false);
  const [claveActual, setClaveActual] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [repetir, setRepetir] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const enviar = async () => {
    setError(""); setFeedback("");
    if (nuevaClave !== repetir) { setError("Las claves nuevas no coinciden"); return; }
    setGuardando(true);
    const result = await authClient.changePassword({ currentPassword: claveActual, newPassword: nuevaClave });
    setGuardando(false);
    if (result.error) {
      const msg = result.error.message ?? "No fue posible cambiar la clave";
      setError(msg.startsWith("PASSWORD_MISMATCH") ? "La clave actual es incorrecta" : msg);
      return;
    }
    setFeedback("Clave actualizada correctamente");
    setClaveActual(""); setNuevaClave(""); setRepetir("");
    setTimeout(() => setAbierto(false), 900);
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" className={className} onClick={() => setAbierto((v) => !v)}>
        <KeyRound className="size-4" />Cambiar clave
      </Button>
      {abierto && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-stone-200 bg-white p-4 text-stone-900 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold">Cambiar mi clave</p>
            <button className="text-stone-400 hover:text-stone-700" aria-label="Cerrar" onClick={() => setAbierto(false)}><X className="size-4" /></button>
          </div>
          <div className="grid gap-3">
            <Field label="Clave actual"><Input type="password" autoComplete="current-password" value={claveActual} onChange={(e) => setClaveActual(e.target.value)} required /></Field>
            <Field label="Clave nueva"><Input type="password" autoComplete="new-password" value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} minLength={8} required /></Field>
            <Field label="Repetir clave nueva"><Input type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} minLength={8} required /></Field>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-2 text-xs text-red-700">{error}</p>}
            {feedback && <p role="status" className="rounded-xl bg-emerald-50 p-2 text-xs text-emerald-700">{feedback}</p>}
            <Button type="button" size="sm" disabled={guardando} onClick={() => void enviar()}>{guardando ? "Guardando..." : "Guardar clave"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}