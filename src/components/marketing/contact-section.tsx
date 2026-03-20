"use client";

import { motion } from "framer-motion";
import { Phone, MessageCircle, ChevronRight } from "lucide-react";

export function ContactSection() {
  return (
    <section id="contact" className="bg-[#0b4f45] py-20 text-white">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="grid gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm sm:p-8 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#f4c542]">
              Direct contact
            </p>

            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Een rit aanvragen? Neem direct contact op.
            </h2>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/85">
              Voor reserveringen, Schiphol vervoer of directe ritten kun je ons
              snel bereiken via telefoon of WhatsApp.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="tel:0644445501"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4c542] px-6 py-3 text-base font-bold text-[#083b34] transition hover:scale-[1.02]"
              >
                <Phone className="h-5 w-5" />
                Bel 0644445501
              </a>

              <a
                href="https://wa.me/31644445501"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                <MessageCircle className="h-5 w-5" />
                Open WhatsApp
              </a>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-[#8a4b00] p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f4c542]">
              Snel geregeld
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-white/70">Telefoon</p>
                <a href="tel:0644445501" className="mt-1 block text-xl font-bold text-white">
                  0644445501
                </a>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-white/70">WhatsApp</p>
                <a
                  href="https://wa.me/31644445501"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-2 text-xl font-bold text-white"
                >
                  Start gesprek
                  <ChevronRight className="h-5 w-5" />
                </a>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-white/70">Beschikbaarheid</p>
                <p className="mt-1 text-xl font-bold text-white">24/7 op afspraak</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}