"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useT } from "@/i18n/client";

/** Nav links with aria-current on the best match (longest prefix, so /admin/users beats /admin). */
export function NavLinks({ links, vertical = false }: { links: [string, string][]; vertical?: boolean }) {
  const path = usePathname();
  const current = links
    .map(([href]) => href)
    .filter((href) => path === href || path.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
  return links.map(([href, label]) => (
    <Link
      key={href}
      href={href}
      aria-current={href === current ? "page" : undefined}
      className={`rounded-md px-2 text-sm hover:bg-line/50 hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground ${
        vertical ? "py-3" : "py-1.5"
      } ${href === current ? "" : "text-muted"}`}
    >
      {label}
    </Link>
  ));
}

/** Phone-width menu. Native <details>, closed again after each navigation. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  const t = useT();
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [path]);
  return (
    <details ref={ref} className="group relative ms-auto sm:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-md border border-field px-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">{t("Menu")}</span>
        <span className="hidden group-open:inline">{t("Close")}</span>
      </summary>
      <div className="absolute end-0 top-full z-20 mt-2 flex w-64 flex-col rounded-lg border border-line bg-surface p-2 shadow-lg">
        {children}
      </div>
    </details>
  );
}
