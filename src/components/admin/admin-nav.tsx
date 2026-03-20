"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/admin/pricing",
    label: "Tarieven",
  },
  {
    href: "/admin/reservations",
    label: "Reserveringen",
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 rounded-[1.5rem] border border-[#0b5a4e]/10 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,32,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row">
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition",
                isActive
                  ? "bg-[#0b5a4e] text-white"
                  : "bg-[#f8fafc] text-[#0f1720] hover:bg-[#eef2f7]",
              ].join(" ")}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}