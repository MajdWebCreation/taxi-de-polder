"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Phone, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { SITE_PHONE_TEL, SITE_WHATSAPP_URL } from "@/lib/site";

const navLinks = [
  { href: "#diensten", label: "Diensten" },
  { href: "#tarieven", label: "Tarieven" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="sticky top-0 z-50 border-b border-white/10 bg-[#0b4f45]/90 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[#f4c542]/30 bg-white/5">
            <Image
              src="/logo-taxi-de-polder.png"
              alt="Taxi De Polder logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>

          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f4c542]">
              Taxi
            </p>
            <p className="text-lg font-bold text-white">De Polder</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/90 transition duration-200 hover:text-[#f4c542]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`tel:${SITE_PHONE_TEL}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#f4c542]/35 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#f4c542] hover:bg-white/5"
          >
            <Phone className="h-4 w-4" />
            Bel direct
          </a>

          <a
            href={SITE_WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#f4c542] px-4 py-2 text-sm font-bold text-[#083b34] transition duration-200 hover:scale-[1.03] hover:shadow-lg"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10 md:hidden"
          aria-label="Menu openen"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 bg-[#0b4f45] md:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col px-4 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-white/90 transition hover:bg-white/5 hover:text-[#f4c542]"
                >
                  {link.label}
                </a>
              ))}

              <div className="mt-3 grid grid-cols-2 gap-3">
                <a
                  href={`tel:${SITE_PHONE_TEL}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#f4c542]/35 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#f4c542]"
                >
                  <Phone className="h-4 w-4" />
                  Bellen
                </a>

                <a
                  href={SITE_WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4c542] px-4 py-3 text-sm font-bold text-[#083b34]"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
