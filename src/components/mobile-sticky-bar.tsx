"use client";

import { MessageCircle, CalendarCheck } from "lucide-react";

export function MobileStickyBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#083b34]/95 p-3 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        <a
          href="#reserveren"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4c542] px-4 py-3 text-sm font-bold text-[#083b34]"
        >
          <CalendarCheck className="h-4 w-4" />
          Reserveer nu
        </a>

        <a
          href="https://wa.me/31644445501"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}