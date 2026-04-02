"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plane } from "lucide-react";
import { SITE_WHATSAPP_URL } from "@/lib/site";
import type { SpecialRate } from "@/types/pricing";

type DisplayRate = {
  place: string;
  price: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function hasSchipholDestination(value: string) {
  return value.toLocaleLowerCase("nl-NL").includes("schiphol");
}

function mapRatesForDisplay(rates: SpecialRate[]): DisplayRate[] {
  return rates
    .filter((rate) => rate.is_active && hasSchipholDestination(rate.to_label))
    .map((rate) => ({
      place: rate.from_label,
      price: formatPrice(rate.fixed_price),
    }));
}

function RateCard({
  title,
  imageSrc,
  imageAlt,
  rates,
}: {
  title: string;
  imageSrc: string;
  imageAlt: string;
  rates: { place: string; price: string }[];
}) {
  return (
    <div className="group rounded-[2rem] bg-[#0b5a4e] p-7 text-white shadow-[0_20px_60px_rgba(13,91,79,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(13,91,79,0.28)] md:p-8">
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-black text-[#f4c542]">{title}</h3>
        <span className="rounded-full bg-[#f4c542] px-4 py-2 text-sm font-bold text-[#083b34]">
          Schiphol
        </span>
      </div>

      <div className="relative mt-8 h-[170px] w-full">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition duration-300 group-hover:scale-[1.02]"
        />
      </div>

      <div className="mt-8 space-y-4">
        {rates.length > 0 ? (
          rates.map((rate) => (
            <div
              key={`${title}-${rate.place}`}
              className="flex items-center justify-between border-b border-white/10 pb-4 text-base"
            >
              <span className="text-white/90">{rate.place}</span>
              <span className="font-bold text-[#f4c542]">{rate.price}</span>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            Er zijn momenteel nog geen speciale Schiphol tarieven beschikbaar.
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href="#reserveren"
          className="inline-flex items-center justify-center rounded-xl bg-[#f4c542] px-5 py-3 text-sm font-bold text-[#083b34] transition hover:scale-[1.02]"
        >
          Boek een rit
        </a>

        <a
          href={SITE_WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Vraag via WhatsApp
        </a>
      </div>
    </div>
  );
}

export function SchipholRatesSection({ rates }: { rates: SpecialRate[] }) {
  const autoRates = mapRatesForDisplay(
    rates.filter((rate) => rate.vehicle_type === "auto")
  );
  const busRates = mapRatesForDisplay(
    rates.filter((rate) => rate.vehicle_type === "busje")
  );

  return (
    <section id="tarieven" className="bg-[#eef0ea] py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0d5b4f]/10 px-4 py-2 text-sm font-semibold text-[#0d5b4f]">
            <Plane className="h-4 w-4" />
            Onze speciale Schiphol tarieven
          </div>

          <h2 className="mt-5 text-3xl font-black text-[#0f1720] sm:text-4xl">
            Transparante prijzen, zonder verrassingen.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#475569]">
            Voor populaire routes naar Schiphol werken wij met duidelijke vaste tarieven
            voor zowel een auto als een busje.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <RateCard
              title="Auto"
              imageSrc="/auto1.png"
              imageAlt="Taxi De Polder auto"
              rates={autoRates}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <RateCard
              title="Busje"
              imageSrc="/busje1.png"
              imageAlt="Taxi De Polder busje"
              rates={busRates}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
