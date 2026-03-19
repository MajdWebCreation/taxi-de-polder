import { ContactSection } from "@/components/contact-section";
import { HeroSection } from "@/components/hero-section";
import { MobileStickyBar } from "@/components/mobile-sticky-bar";
import { Navbar } from "@/components/navbar";
import { ReservationSection } from "@/components/reservation-section";
import { SchipholRatesSection } from "@/components/schiphol-rates-section";
import { ServicesSection } from "@/components/services-section";
import { SiteFooter } from "@/components/site-footer";
import { WhyChooseSection } from "@/components/why-choose-section";

export default function HomePage() {
  return (
    <>
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