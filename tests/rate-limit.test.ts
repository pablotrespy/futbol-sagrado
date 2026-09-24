// Rate limit en memoria usado por recuperación de clave y rutas sensibles.
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkLimit, resetLimit } from "@/lib/rate-limit";

describe("rate limit en memoria", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite llamadas dentro del límite", () => {
    expect(checkLimit("clave-a", 2, 60_000).ok).toBe(true);
    expect(checkLimit("clave-a", 2, 60_000).ok).toBe(true);
  });

  it("bloquea al superar el límite en la ventana", () => {
    checkLimit("clave-b", 1, 60_000);
    const res = checkLimit("clave-b", 1, 60_000);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.retryAfter).toBeGreaterThan(0);
  });

  it("renueva la ventana cuando expira", () => {
    vi.useFakeTimers();
    checkLimit("clave-c", 1, 1_000);
    vi.advanceTimersByTime(1_001);
    expect(checkLimit("clave-c", 1, 1_000).ok).toBe(true);
  });

  it("resetLimit limpia el contador", () => {
    checkLimit("clave-d", 1, 60_000);
    resetLimit("clave-d");
    expect(checkLimit("clave-d", 1, 60_000).ok).toBe(true);
  });
});