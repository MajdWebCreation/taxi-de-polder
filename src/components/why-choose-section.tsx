"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Clock3, PhoneCall, Star } from "lucide-react";

const points = [
  {
    title: "Betrouwbare service",
    text: "Je kunt rekenen op duidelijke communicatie, nette service en stipte ritten.",
    icon: ShieldCheck,
  },
  {
    title: "Altijd bereikbaar",
    text: "Voor vragen, reserveringen en directe ritten kun je snel contact opnemen.",
    icon: PhoneCall,
  },
  {
    title: "24/7 inzetbaar",
    text: "Ook voor vroege of late ritten bieden wij een flexibele en betrouwbare oplossing.",
    icon: Clock3,
  },
  {
    title: "Comfortabel reizen",
    text: "Een prettige rit met focus op gemak, rust en professionele uitstraling.",
    icon: Star,
  },
];

export function WhyChooseSection() {
  return (
    <section className="bg-[#f6f4ee] py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#0d5b4f]">
            Waarom Taxi De Polder
          </p>

          <h2 className="mt-4 text-3xl font-black text-[#0f1720] sm:text-4xl">
            Een taxiservice die draait om vertrouwen, duidelijkheid en gemak.
          </h2>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#475569]">
            Voor een taxibedrijf is het belangrijk dat bezoekers meteen voelen dat
            ze te maken hebben met een serieuze partij. Daarom is Taxi De Polder
            gericht op service, heldere communicatie en professionele uitstraling.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {points.map((point, index) => {
              const Icon = point.icon;

              return (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="rounded-[1.5rem] border border-[#0d5b4f]/10 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,32,0.05)]"
                >
                  <Icon className="h-6 w-6 text-[#0d5b4f]" />
                  <h3 className="mt-4 text-lg font-bold text-[#0f1720]">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#475569]">
                    {point.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="rounded-[2rem] bg-[#8a4b00] p-8 text-white shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#f4c542]">
            Snel geregeld
          </p>

          <h3 className="mt-4 text-3xl font-black">
            Bel, app of reserveer jouw rit direct.
          </h3>

          <p className="mt-4 text-base leading-8 text-white/85">
            Heb je direct vervoer nodig of wil je een rit vooruit plannen? Neem
            eenvoudig contact op en wij helpen je snel verder.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70">Telefoon</p>
              <a
                href="tel:0644445501"
                className="mt-1 block text-xl font-bold text-[#f4c542]"
              >
                0644445501
              </a>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70">Beschikbaarheid</p>
              <p className="mt-1 text-xl font-bold text-[#f4c542]">24/7</p>
            </div>
          </div>

          <a
            href="https://wa.me/31644445501"
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex rounded-full bg-[#f4c542] px-6 py-3 text-sm font-bold text-[#083b34] transition hover:scale-[1.02]"
          >
            Start WhatsApp gesprek
          </a>
        </motion.div>
      </div>
    </section>
  );
}