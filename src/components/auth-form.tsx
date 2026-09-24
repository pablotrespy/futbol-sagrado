"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
import { signIn, getSession } from "@/lib/auth-client";
import { http } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function AuthForm() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "peticion" | "confirmar">("login");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [serverError, setServerError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectByRole = async () => {
    const { data } = await getSession();
    const rol = String((data?.user as { role?: unknown } | undefined)?.role ?? "");
    const destino = ["admin", "supervisor", "operador_de_mesa"].includes(rol) ? "/admin" : rol === "delegado" ? "/delegados/planilla" : "/";
    router.push(destino);
    router.refresh();
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(""); setInfo(""); setIsSubmitting(true);
    try {
      const result = await signIn.username({ username: usuario, password });
      if (result.error) {
        const code = (result.error as { code?: string } | undefined)?.code ?? "";
        setServerError(code === "INVALID_USERNAME_OR_PASSWORD" ? "Usuario o contraseña incorrectos." : "No fue posible iniciar sesión. Verificá tus datos e intentá de nuevo.");
        return;
      }
      await redirectByRole();
    } catch (err: unknown) {
      setServerError(err instanceof Error ? `Error de conexión: ${err.message}` : "Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePedirCodigo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(""); setInfo(""); setIsSubmitting(true);
    try {
      await http.post("/api/recovery/request", { telefono });
      setInfo("Si el número está registrado, ya se generó un código. Solicítalo al administrador.");
      setStep("confirmar");
    } catch {
      setServerError("No fue posible procesar el teléfono");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(""); setInfo(""); setIsSubmitting(true);
    try {
      await http.post("/api/recovery/confirm", { telefono, codigo, nuevaClave });
      setInfo("Clave restablecida. Ingresa con tu usuario y la nueva clave.");
      setPassword("");
      setCodigo("");
      setNuevaClave("");
      setStep("login");
    } catch (err: unknown) {
      const msg = (err instanceof Object && "response" in err && (err as { response?: { data?: { error?: string } } }).response?.data?.error) ?? "Código inválido o expirado";
      setServerError(String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
      <button type="button" aria-label="Cerrar y volver al inicio" onClick={() => { router.push("/"); router.refresh(); }} className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"><X className="size-4" /></button>
      <div className="mb-7">
        <span className="inline-grid size-11 place-items-center rounded-full bg-red-800 font-black text-amber-200">50+</span>
        <h1 className="mt-5 text-2xl font-black text-stone-900">
          {step === "login" ? "Bienvenido de vuelta" : step === "peticion" ? "Recuperar clave" : "Nueva clave"}
        </h1>
        <p className="mt-1 text-sm text-stone-500">Panel del Campeonato Padres Plus 50</p>
      </div>

      {step === "login" && (
        <form onSubmit={handleLogin} className="grid gap-4">
          <Field label="Nombre de usuario">
            <Input autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus required />
          </Field>
          <Field label="Contraseña">
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" required />
              <button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          {serverError && <p role="alert" className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{serverError}</p>}
          {info && <p role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">{info}</p>}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Procesando..." : "Ingresar"}</Button>
          <button type="button" className="mt-1 w-full text-sm text-stone-500 hover:text-red-700" onClick={() => { setStep("peticion"); setServerError(""); setInfo(""); }}>
            ¿Olvidaste tu clave?
          </button>
        </form>
      )}

      {step === "peticion" && (
        <form onSubmit={handlePedirCodigo} className="grid gap-4">
          <Field label="Teléfono registrado">
            <Input inputMode="tel" autoComplete="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} autoFocus required />
          </Field>
          {serverError && <p role="alert" className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{serverError}</p>}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Procesando..." : "Generar código"}</Button>
          <button type="button" className="mt-1 w-full text-sm text-stone-500 hover:text-red-700" onClick={() => { setStep("login"); setServerError(""); setInfo(""); }}>
            Volver al ingreso
          </button>
        </form>
      )}

      {step === "confirmar" && (
        <form onSubmit={handleConfirmar} className="grid gap-4">
          <Field label="Teléfono registrado">
            <Input inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          </Field>
          <Field label="Código de 6 dígitos">
            <Input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
          </Field>
          <Field label="Nueva contraseña">
            <Input type="password" autoComplete="new-password" value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} minLength={8} required />
          </Field>
          {info && <p role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">{info}</p>}
          {serverError && <p role="alert" className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{serverError}</p>}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Procesando..." : "Restablecer clave"}</Button>
          <button type="button" className="mt-1 w-full text-sm text-stone-500 hover:text-red-700" onClick={() => { setStep("peticion"); setServerError(""); setInfo(""); }}>
            Volver
          </button>
        </form>
      )}
    </section>
  );
}
