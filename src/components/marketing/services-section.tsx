"use client";

import { motion } from "framer-motion";
import { Plane, Briefcase, Clock3, CarFront } from "lucide-react";

const services = [
  {
    title: "Schiphol vervoer",
    description:
      "Vaste tarieven naar Schiphol, duidelijke afspraken en betrouwbare service zonder verrassingen.",
    icon: Plane,
  },
  {
    title: "Zakelijk vervoer",
    description:
      "Comfortabele en representatieve ritten voor zakelijke afspraken, hotels, kantoren en stations.",
    icon: Briefcase,
  },
  {
    title: "24/7 service",
    description:
      "Ook voor vroege ochtendritten, late avonden of geplande ritten buiten standaardtijden.",
    icon: Clock3,
  },
  {
    title: "Lokale ritten",
    description:
      "Snel en veilig vervoer in de regio voor dagelijkse ritten, afspraken en speciale gelegenheden.",
    icon: CarFront,
  },
];

export function ServicesSection() {
  return (
    <section id="diensten" className="bg-[#f6f4ee] py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#0d5b4f]">
            Onze diensten
          </p>
          <h2 className="mt-4 text-3xl font-black text-[#0f1720] sm:text-4xl">
            Duidelijk, professioneel en gericht op gemak.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#334155]">
            Taxi De Polder biedt betrouwbare service voor luchthavenvervoer,
            zakelijke ritten en comfortabele lokale ritten in de regio.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => {
            const Icon = service.icon;

            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                className="rounded-[1.75rem] border border-[#0d5b4f]/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,32,0.06)] transition hover:-translate-y-1"
              >
                <div className="inline-flex rounded-2xl bg-[#0d5b4f] p-3 text-[#f4c542]">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-xl font-bold text-[#0f1720]">
                  {service.title}
                </h3>

                <p className="mt-3 text-[15px] leading-7 text-[#475569]">
                  {service.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}