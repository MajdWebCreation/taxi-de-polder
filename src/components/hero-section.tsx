"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck, Clock3, Plane } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    text: "Betrouwbare en professionele service",
  },
  {
    icon: Clock3,
    text: "24/7 beschikbaar op afspraak",
  },
  {
    icon: Plane,
    text: "Specialist in Schiphol vervoer",
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0b4f45] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,197,66,0.16),transparent_28%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_35%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)]" />

      <div className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-12 px-4 py-14 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="max-w-2xl"
        >
          <span className="inline-flex rounded-full border border-[#f4c542]/30 bg-[#f4c542]/10 px-4 py-1 text-sm font-semibold text-[#f4c542]">
            Vaste tarieven • Professionele service
          </span>

          <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            Taxi De Polder voor comfortabele ritten, Schiphol vervoer en snelle service.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-white/85">
            Betrouwbaar vervoer voor particulieren en zakelijke klanten. Duidelijke
            communicatie, vaste tarieven en direct contact via telefoon of WhatsApp.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#reserveren"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4c542] px-6 py-3 text-base font-bold text-[#083b34] transition duration-200 hover:scale-[1.03] hover:shadow-xl"
            >
              Reserveer nu
            </a>

            <a
              href="https://wa.me/31644445501"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-base font-semibold text-white transition duration-200 hover:bg-white/10"
            >
              Vraag via WhatsApp
            </a>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {features.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.text}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <Icon className="mb-3 h-5 w-5 text-[#f4c542]" />
                  <p className="text-sm leading-6 text-white/85">{item.text}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="relative mx-auto rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#127262] via-[#0f5e53] to-[#083b34] p-6 shadow-2xl shadow-black/30">
            <div className="absolute inset-5 rounded-[1.6rem] border border-[#f4c542]/15" />

            <div className="relative z-10 flex min-h-[480px] flex-col justify-between">
              <div className="flex justify-center pt-3">
                <div className="relative h-36 w-36 sm:h-40 sm:w-40">
                  <Image
                    src="/logo-taxi-de-polder.png"
                    alt="Taxi De Polder logo"
                    fill
                    className="object-contain drop-shadow-[0_16px_35px_rgba(0,0,0,0.3)]"
                    priority
                  />
                </div>
              </div>

              <div className="relative mx-auto mt-2 h-[220px] w-full max-w-[560px]">
                <Image
                  src="/auto1.png"
                  alt="Taxi De Polder auto"
                  fill
                  className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
                  priority
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/65">Beschikbaar</p>
                  <p className="mt-1 text-lg font-bold text-[#f4c542]">24/7 op afspraak</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/65">Specialisatie</p>
                  <p className="mt-1 text-lg font-bold text-[#f4c542]">
                    Schiphol & zakelijke ritten
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}