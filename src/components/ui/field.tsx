// Fase 1: envoltorio uniforme para etiquetas y errores de formulario.
export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium text-stone-700"><span>{label}</span>{children}{error && <span className="text-xs font-normal text-red-600">{error}</span>}</label>;
}
