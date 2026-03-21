import Image from "next/image";
import { Check } from "lucide-react";
import {
  SITE_EMAIL,
  SITE_CREDIT_URL,
  SITE_KVK,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  SITE_WHATSAPP_URL,
} from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-[#8a4b00] pb-24 text-white md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white/10">
              <Image
                src="/logo-taxi-de-polder.png"
                alt="Taxi De Polder logo"
                fill
                className="object-contain p-1"
              />
            </div>

            <p className="text-lg font-bold">Taxi De Polder</p>
          </div>

          <p className="mt-5 max-w-xs text-base leading-8 text-white/80">
            Specialist in <span className="font-bold text-[#f4c542]">Schipholvervoer</span> met
            vaste tarieven. Duidelijk, professioneel en betrouwbaar.
          </p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/80">Contact</p>
          <div className="mt-5 space-y-3 text-base text-white/90">
            <a
              href={`tel:${SITE_PHONE_TEL}`}
              className="block transition hover:text-[#f4c542]"
            >
              {SITE_PHONE_DISPLAY}
            </a>
            <p>{SITE_EMAIL}</p>
          </div>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/80">
            Bedrijfsinfo
          </p>
          <div className="mt-5 space-y-3 text-base text-white/90">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-sky-300" />
              <span>24/7</span>
            </div>
            <p>KvK: {SITE_KVK}</p>
          </div>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/80">Direct regelen</p>
          <p className="mt-5 max-w-xs text-base leading-8 text-white/80">
            Neem direct contact op voor een rit, reservering of Schiphol aanvraag.
          </p>

          <a
            href={SITE_WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            WhatsApp openen
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 text-center md:flex-row md:px-6 lg:px-8">
          <p className="text-sm text-white/65">
            © {new Date().getFullYear()} Taxi De Polder. Alle rechten voorbehouden.
          </p>

          <a
            href={SITE_CREDIT_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Bezoek de website van YM Creations"
            className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/10 px-3 py-2 text-sm text-white/80 transition hover:border-[#f4c542]/50 hover:bg-black/20 hover:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/20 text-[0.7rem] font-semibold tracking-[0.28em] text-[#f4c542] shadow-[0_0_20px_rgba(0,0,0,0.18)] transition group-hover:scale-105 group-hover:border-[#f4c542]/60">
              YM
            </span>
            <span className="text-left leading-tight">
              <span className="block text-[0.65rem] uppercase tracking-[0.22em] text-white/50">
                Made by
              </span>
              <span className="block font-medium text-white">YM Creations</span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
