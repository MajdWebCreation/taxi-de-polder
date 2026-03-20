import { ContactSection } from "@/components/marketing/contact-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { MobileStickyBar } from "@/components/marketing/mobile-sticky-bar";
import { Navbar } from "@/components/marketing/navbar";
import { ReservationSection } from "@/components/reservation/reservation-section";
import { SchipholRatesSection } from "@/components/marketing/schiphol-rates-section";
import { ServicesSection } from "@/components/marketing/services-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { WhyChooseSection } from "@/components/marketing/why-choose-section";

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
