import Image from "next/image";
import { Check } from "lucide-react";

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
            <a href="tel:0644445501" className="block transition hover:text-[#f4c542]">
              +31 6 44445501
            </a>
            <p>info@taxidepolder.nl</p>
          </div>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/80">Openingstijden</p>
          <div className="mt-5 flex items-center gap-2 text-base text-white/90">
            <Check className="h-4 w-4 text-sky-300" />
            <span>24/7</span>
          </div>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/80">Direct regelen</p>
          <p className="mt-5 max-w-xs text-base leading-8 text-white/80">
            Neem direct contact op voor een rit, reservering of Schiphol aanvraag.
          </p>

          <a
            href="https://wa.me/31644445501"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            WhatsApp openen
          </a>
        </div>
      </div>
    </footer>
  );
}