import type { Metadata } from "next";
import { ContactSection } from "@/components/marketing/contact-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { MobileStickyBar } from "@/components/marketing/mobile-sticky-bar";
import { Navbar } from "@/components/marketing/navbar";
import { ReservationSection } from "@/components/reservation/reservation-section";
import { SchipholRatesSection } from "@/components/marketing/schiphol-rates-section";
import { ServicesSection } from "@/components/marketing/services-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { WhyChooseSection } from "@/components/marketing/why-choose-section";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SERVICE_AREAS,
  SITE_EMAIL,
  SITE_KVK,
  SITE_PHONE_RAW,
  SITE_URL,
  SITE_WHATSAPP_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: "/logo-taxi-de-polder.png",
        width: 1024,
        height: 1024,
        alt: "Taxi De Polder logo",
      },
    ],
  },
  twitter: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["/logo-taxi-de-polder.png"],
  },
};

export default function HomePage() {
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Taxi De Polder",
    url: SITE_URL,
    image: `${SITE_URL}/logo-taxi-de-polder.png`,
    telephone: SITE_PHONE_RAW,
    email: SITE_EMAIL,
    taxID: SITE_KVK,
    areaServed: [...SERVICE_AREAS],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    sameAs: [SITE_WHATSAPP_URL],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />
      <Navbar />
      <main className="min-h-screen bg-[#f6f4ee] text-[#0f1720]">
        <HeroSection />
        <ReservationSection />
        <ServicesSection />
        <SchipholRatesSection />
        <WhyChooseSection />
        <ContactSection />
      </main>
      <SiteFooter />
      <MobileStickyBar />
    </>
  );
}
