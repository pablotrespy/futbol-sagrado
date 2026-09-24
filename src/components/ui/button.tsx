// Fase 1: botón base accesible siguiendo el patrón de shadcn/ui.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center rounded-xl text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500", {
  variants: {
    variant: {
      default: "bg-red-600 text-white hover:bg-red-500",
      outline: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
      ghost: "text-stone-600 hover:bg-stone-100",
      danger: "bg-red-50 text-red-700 hover:bg-red-100",
    },
    size: { default: "h-11 px-4", sm: "h-9 px-3", icon: "size-9" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export function Button({ className, variant, size, ...props }: ButtonProps) { return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />; }
