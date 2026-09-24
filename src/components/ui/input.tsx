// Fase 1: campo base accesible siguiendo el patrón de shadcn/ui.
import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:bg-stone-100", className)} {...props} />;
}
