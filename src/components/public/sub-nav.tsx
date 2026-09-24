"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/campeonato", label: "Calendario" },
  { href: "/campeonato/posiciones", label: "Posiciones / Goleadores" },
  { href: "/campeonato/amonestaciones", label: "Amonestados" },
  { href: "/campeonato/comunicados", label: "Comunicados" },
];

function SubNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const torneo = searchParams.get("torneo");

  const isActive = (href: string) =>
    href === "/campeonato" ? pathname === "/campeonato" : pathname.startsWith(href);

  const hrefConTorneo = (href: string) => (torneo ? `${href}?torneo=${encodeURIComponent(torneo)}` : href);

  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-7">
      <nav className="hidden gap-1 overflow-x-auto py-2 sm:flex">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={hrefConTorneo(item.href)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
              isActive(item.href)
                ? "bg-red-100 text-red-700 font-bold"
                : "text-stone-500 hover:bg-stone-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="relative sm:hidden">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
          <span>{NAV_ITEMS.find((i) => isActive(i.href))?.label ?? "Menú"}</span>
        </button>
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border bg-white py-1 shadow-lg">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={hrefConTorneo(item.href)}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2 text-sm font-semibold transition ${
                  isActive(item.href)
                    ? "bg-red-100 text-red-700 font-bold"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SubNav() {
  return (
    <div className="sticky top-20 z-30 border-b border-stone-200 bg-white">
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-3 sm:px-7" />}>
        <SubNavInner />
      </Suspense>
    </div>
  );
}