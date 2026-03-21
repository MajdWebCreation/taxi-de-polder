"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CarFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  Send,
  Users,
  CalendarDays,
  Clock3,
  MapPin,
} from "lucide-react";
import { AddressAutocompleteInput } from "@/components/ui/address-autocomplete-input";

type Step = 1 | 2 | 3 | 4;
type Vehicle = "auto" | "busje" | "";

type QuoteResponse = {
  success: true;
  route: {
    distanceMeters: number;
    durationSeconds: number;
    distanceKm: number;
    durationText: string;
  };
  pricing: {
    baseFare: number;
    minimumFare: number;
    distanceKm: number;
    subtotal: number;
    schipholApplied: boolean;
    nightApplied: boolean;
    total: number;
  };
};

type FormState = {
  pickup: string;
  destination: string;
  pickupDate: string;
  pickupHour: string;
  pickupMinute: string;
  passengers: string;
  vehicle: Vehicle;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
};

const stepLabels = [
  { id: 1, label: "Rit" },
  { id: 2, label: "Voertuig" },
  { id: 3, label: "Gegevens" },
  { id: 4, label: "Verzenden" },
] as const;

const initialForm: FormState = {
  pickup: "",
  destination: "",
  pickupDate: "",
  pickupHour: "",
  pickupMinute: "00",
  passengers: "1",
  vehicle: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
};

const passengerOptions = ["1", "2", "3", "4", "5", "6"];
const minuteOptions = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const hourOptions = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);

const reservationFieldLabels = {
  pickup: "vertrekadres",
  destination: "aankomstadres",
  pickupDate: "datum",
  pickupHour: "uur",
  pickupMinute: "minuten",
  passengers: "aantal passagiers",
  vehicle: "voertuig",
  firstName: "voornaam",
  lastName: "achternaam",
  email: "e-mailadres",
  phone: "telefoonnummer",
} as const;

function getTodayLocalDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function buildPickupDateTime(date: string, hour: string, minute: string) {
  if (!date || hour === "" || minute === "") return null;
  return new Date(`${date}T${hour}:${minute}:00`);
}

function isFutureDateTime(date: string, hour: string, minute: string) {
  const value = buildPickupDateTime(date, hour, minute);
  if (!value) return false;
  return value.getTime() > Date.now();
}

function formatReadablePickup(date: string, hour: string, minute: string) {
  if (!date || hour === "" || minute === "") return "-";
  return `${date} om ${hour}:${minute}`;
}

function RequiredBadge() {
  return (
    <span className="rounded-full bg-[#f4c542]/20 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#0b5a4e]">
      Verplicht
    </span>
  );
}

export function ReservationSection() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [touched, setTouched] = useState(false);

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState("");
  const [reserveError, setReserveError] = useState("");

  const todayMin = useMemo(() => getTodayLocalDate(), []);

  const validation = useMemo(() => {
    return {
      step1:
        form.pickup.trim().length > 5 &&
        form.destination.trim().length > 5 &&
        form.pickupDate.trim().length > 0 &&
        form.pickupHour.trim().length > 0 &&
        form.pickupMinute.trim().length > 0 &&
        isFutureDateTime(form.pickupDate, form.pickupHour, form.pickupMinute) &&
        form.passengers.trim().length > 0,
      step2: form.vehicle === "auto" || form.vehicle === "busje",
      step3:
        form.firstName.trim().length > 1 &&
        form.lastName.trim().length > 1 &&
        form.email.trim().length > 4 &&
        form.phone.trim().length > 5,
    };
  }, [form]);

  const missingRequiredFields = useMemo(() => {
    const fields: string[] = [];

    if (form.pickup.trim().length <= 5) fields.push(reservationFieldLabels.pickup);
    if (form.destination.trim().length <= 5) {
      fields.push(reservationFieldLabels.destination);
    }
    if (!form.pickupDate.trim()) fields.push(reservationFieldLabels.pickupDate);
    if (!form.pickupHour.trim()) fields.push(reservationFieldLabels.pickupHour);
    if (!form.pickupMinute.trim()) fields.push(reservationFieldLabels.pickupMinute);
    if (!form.passengers.trim()) fields.push(reservationFieldLabels.passengers);
    if (!(form.vehicle === "auto" || form.vehicle === "busje")) {
      fields.push(reservationFieldLabels.vehicle);
    }
    if (form.firstName.trim().length <= 1) {
      fields.push(reservationFieldLabels.firstName);
    }
    if (form.lastName.trim().length <= 1) fields.push(reservationFieldLabels.lastName);
    if (form.email.trim().length <= 4) fields.push(reservationFieldLabels.email);
    if (form.phone.trim().length <= 5) fields.push(reservationFieldLabels.phone);

    return fields;
  }, [form]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (
      key === "pickup" ||
      key === "destination" ||
      key === "pickupDate" ||
      key === "pickupHour" ||
      key === "pickupMinute" ||
      key === "vehicle"
    ) {
      setQuote(null);
      setQuoteError("");
      setReserveSuccess("");
      setReserveError("");
    }
  }

  async function handleCalculateQuote() {
    setTouched(true);
    setQuoteError("");
    setQuote(null);

    if (!validation.step1 || !validation.step2) {
      setQuoteError("Vul eerst geldige ritgegevens in en kies een voertuig.");
      return;
    }

    try {
      setQuoteLoading(true);

      const response = await fetch("/api/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup: form.pickup,
          destination: form.destination,
          pickupHour: form.pickupHour,
          vehicle: form.vehicle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Prijsberekening mislukt");
      }

      setQuote(data as QuoteResponse);
    } catch (error) {
      setQuoteError(
        error instanceof Error ? error.message : "Prijsberekening mislukt"
      );
    } finally {
      setQuoteLoading(false);
    }
  }

  async function goNext() {
    setTouched(true);

    if (step === 1 && !validation.step1) return;
    if (step === 2 && !validation.step2) return;
    if (step === 3 && !validation.step3) return;

    if (step === 2 && !quote) {
      await handleCalculateQuote();
      return;
    }

    if (step < 4) {
      setStep((prev) => (prev + 1) as Step);
      setTouched(false);
    }
  }

  function goPrev() {
    if (step > 1) {
      setStep((prev) => (prev - 1) as Step);
      setTouched(false);
    }
  }

  async function handleReservationSubmit() {
    setTouched(true);
    setReserveLoading(true);
    setReserveError("");
    setReserveSuccess("");

    if (!validation.step1) {
      setStep(1);
      setReserveLoading(false);
      setReserveError(
        "Vul eerst alle verplichte ritgegevens in en kies een geldig toekomstig ophaalmoment."
      );
      return;
    }

    if (!validation.step2) {
      setStep(2);
      setReserveLoading(false);
      setReserveError("Kies eerst een voertuig om uw reservering af te ronden.");
      return;
    }

    if (!quote) {
      setStep(2);
      setReserveLoading(false);
      setReserveError("Bereken eerst de ritprijs voordat u uw reservering verstuurt.");
      return;
    }

    if (!validation.step3) {
      setStep(3);
      setReserveLoading(false);
      setReserveError(
        `Vul nog de verplichte velden in: ${missingRequiredFields.join(", ")}.`
      );
      return;
    }

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup: form.pickup,
          destination: form.destination,
          pickupDate: form.pickupDate,
          pickupHour: form.pickupHour,
          pickupMinute: form.pickupMinute,
          passengers: form.passengers,
          vehicle: form.vehicle,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          notes: form.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reservering verzenden mislukt");
      }

      setReserveSuccess("Reservering verzonden.");
    } catch (error) {
      setReserveError(
        error instanceof Error ? error.message : "Reservering verzenden mislukt"
      );
    } finally {
      setReserveLoading(false);
    }
  }

  return (
    <section id="reserveren" className="bg-[#f6f4ee] py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#0b5a4e]">
            Reserveer nu
          </p>
          <h2 className="mt-4 text-3xl font-black text-[#0f1720] sm:text-4xl">
            Reserveer eenvoudig uw rit in een paar duidelijke stappen.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#475569]">
            Vul uw ritgegevens in, kies het gewenste voertuig en verstuur uw aanvraag direct.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#0b5a4e]/10 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,32,0.06)] sm:p-8">
          <div className="mx-auto mb-10 flex max-w-3xl items-center justify-between gap-3">
            {stepLabels.map((item, index) => {
              const active = step === item.id;
              const done = step > item.id;

              return (
                <div key={item.id} className="flex flex-1 items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={[
                        "flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold transition",
                        active
                          ? "border-[#f4c542] bg-[#0b5a4e] text-white"
                          : done
                          ? "border-[#0b5a4e] bg-[#0b5a4e] text-white"
                          : "border-[#cbd5e1] bg-white text-[#334155]",
                      ].join(" ")}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : item.id}
                    </div>
                    <span
                      className={[
                        "mt-2 text-xs font-semibold uppercase tracking-[0.18em]",
                        active || done ? "text-[#0b5a4e]" : "text-[#64748b]",
                      ].join(" ")}
                    >
                      {item.label}
                    </span>
                  </div>

                  {index < stepLabels.length - 1 && (
                    <div className="hidden h-[2px] flex-1 rounded-full bg-[#e2e8f0] md:block">
                      <div
                        className="h-full rounded-full bg-[#f4c542] transition-all duration-300"
                        style={{ width: step > item.id ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.75rem] border border-[#0b5a4e]/10 bg-[#fcfcfb] p-5 sm:p-6">
              {step === 1 && (
                <div>
                  <h3 className="text-2xl font-black text-[#0f1720]">
                    Ritgegevens
                  </h3>
                  <p className="mt-2 text-[#64748b]">
                    Kies vertrek, bestemming en een toekomstig ophaalmoment.
                  </p>
                  <p className="mt-3 text-sm text-[#64748b]">
                    Velden met <span className="font-semibold text-[#0b5a4e]">Verplicht</span> moeten
                    ingevuld zijn.
                  </p>

                  <div className="mt-8 grid gap-5">
                    <AddressAutocompleteInput
                      label="Vertrekadres"
                      value={form.pickup}
                      onChange={(value) => updateField("pickup", value)}
                      placeholder="Typ straat, postcode of plaats"
                      required
                      invalid={touched && form.pickup.trim().length <= 5}
                      error={
                        touched && form.pickup.trim().length <= 5
                          ? "Kies een volledig vertrekadres."
                          : ""
                      }
                    />

                    <AddressAutocompleteInput
                      label="Aankomstadres"
                      value={form.destination}
                      onChange={(value) => updateField("destination", value)}
                      placeholder="Typ straat, postcode of plaats"
                      required
                      invalid={touched && form.destination.trim().length <= 5}
                      error={
                        touched && form.destination.trim().length <= 5
                          ? "Kies een volledig aankomstadres."
                          : ""
                      }
                    />

                    <div className="rounded-[1.5rem] border border-[#e2e8f0] bg-[#f8fafc] p-4 sm:p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[#0b5a4e]" />
                        <p className="text-sm font-bold text-[#0f1720]">
                          Wanneer wilt u worden opgehaald?
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[1fr_140px_140px]">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[#475569]">
                            Datum
                            <span className="ml-2 align-middle">
                              <RequiredBadge />
                            </span>
                          </label>
                          <input
                            type="date"
                            min={todayMin}
                            value={form.pickupDate}
                            onChange={(e) => updateField("pickupDate", e.target.value)}
                            aria-invalid={touched && !form.pickupDate.trim()}
                            className={[
                              "w-full rounded-2xl border bg-white px-4 py-4 outline-none transition focus:ring-4",
                              touched && !form.pickupDate.trim()
                                ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                                : "border-[#d6d9df] focus:border-[#0b5a4e] focus:ring-[#0b5a4e]/10",
                            ].join(" ")}
                          />
                        </div>

                        <div>
                          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#475569]">
                            <Clock3 className="h-4 w-4 text-[#0b5a4e]" />
                            Uur
                            <RequiredBadge />
                          </label>
                          <select
                            value={form.pickupHour}
                            onChange={(e) => updateField("pickupHour", e.target.value)}
                            aria-invalid={touched && !form.pickupHour.trim()}
                            className={[
                              "w-full rounded-2xl border bg-white px-4 py-4 outline-none transition focus:ring-4",
                              touched && !form.pickupHour.trim()
                                ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                                : "border-[#d6d9df] focus:border-[#0b5a4e] focus:ring-[#0b5a4e]/10",
                            ].join(" ")}
                          >
                            <option value="">Kies</option>
                            {hourOptions.map((hour) => (
                              <option key={hour} value={hour}>
                                {hour}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#475569]">
                            <Clock3 className="h-4 w-4 text-[#0b5a4e]" />
                            Minuten
                            <RequiredBadge />
                          </label>
                          <select
                            value={form.pickupMinute}
                            onChange={(e) => updateField("pickupMinute", e.target.value)}
                            aria-invalid={touched && !form.pickupMinute.trim()}
                            className={[
                              "w-full rounded-2xl border bg-white px-4 py-4 outline-none transition focus:ring-4",
                              touched && !form.pickupMinute.trim()
                                ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                                : "border-[#d6d9df] focus:border-[#0b5a4e] focus:ring-[#0b5a4e]/10",
                            ].join(" ")}
                          >
                            {minuteOptions.map((minute) => (
                              <option key={minute} value={minute}>
                                {minute}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {touched &&
                        !isFutureDateTime(
                          form.pickupDate,
                          form.pickupHour,
                          form.pickupMinute
                        ) && (
                          <p className="mt-3 text-sm text-red-600">
                            Kies een geldig toekomstig tijdstip.
                          </p>
                        )}
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0f1720]">
                        <Users className="h-4 w-4 text-[#0b5a4e]" />
                        Aantal passagiers
                        <RequiredBadge />
                      </label>
                      <select
                        value={form.passengers}
                        onChange={(e) => updateField("passengers", e.target.value)}
                        className="w-full rounded-2xl border border-[#d6d9df] bg-white px-4 py-4 outline-none transition focus:border-[#0b5a4e] focus:ring-4 focus:ring-[#0b5a4e]/10"
                      >
                        {passengerOptions.map((option) => (
                          <option key={option} value={option}>
                            {option} passagier{option !== "1" ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="text-2xl font-black text-[#0f1720]">
                    Kies uw voertuig
                  </h3>
                  <p className="mt-2 text-[#64748b]">
                    Selecteer het juiste voertuig en bereken direct de prijs.
                  </p>
                  <p className="mt-3 text-sm text-[#64748b]">
                    Uw voertuigkeuze is <span className="font-semibold text-[#0b5a4e]">verplicht</span>
                    {" "}om de prijs te berekenen.
                  </p>

                  <div className="mt-8 grid gap-5">
                    <VehicleCard
                      active={form.vehicle === "auto"}
                      title="Auto"
                      badge="Tot 4 passagiers"
                      description="Comfortabele sedan voor standaard ritten, Schiphol vervoer en zakelijke afspraken."
                      imageSrc="/auto1.png"
                      imageAlt="Taxi De Polder auto"
                      onClick={() => updateField("vehicle", "auto")}
                    />

                    <VehicleCard
                      active={form.vehicle === "busje"}
                      title="Busje"
                      badge="Tot 6 passagiers"
                      description="Ideaal voor grotere gezelschappen en extra bagage."
                      imageSrc="/busje1.png"
                      imageAlt="Taxi De Polder busje"
                      onClick={() => updateField("vehicle", "busje")}
                    />
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleCalculateQuote}
                      disabled={quoteLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0b5a4e] px-6 py-3 font-bold text-white transition hover:scale-[1.02] disabled:opacity-70"
                    >
                      {quoteLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Prijs berekenen...
                        </>
                      ) : (
                        <>
                          <CarFront className="h-4 w-4" />
                          Bereken prijs
                        </>
                      )}
                    </button>

                    {quote && (
                      <div className="inline-flex items-center rounded-full bg-[#f4c542]/20 px-4 py-3 font-semibold text-[#0b5a4e]">
                        Live prijs: € {quote.pricing.total.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {quoteError && (
                    <p className="mt-4 text-sm text-red-600">{quoteError}</p>
                  )}

                  {touched && !validation.step2 && (
                    <p className="mt-3 text-sm text-red-600">
                      Kies een voertuig om verder te gaan.
                    </p>
                  )}
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3 className="text-2xl font-black text-[#0f1720]">
                    Uw contactgegevens
                  </h3>
                  <p className="mt-2 text-[#64748b]">
                    Laat uw gegevens achter, zodat wij uw aanvraag zorgvuldig kunnen verwerken.
                  </p>
                  <p className="mt-3 text-sm text-[#64748b]">
                    Velden met <span className="font-semibold text-[#0b5a4e]">Verplicht</span> moeten
                    ingevuld zijn.
                  </p>

                  <div className="mt-8 grid gap-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0f1720]">
                          Voornaam
                          <RequiredBadge />
                        </label>
                        <input
                          value={form.firstName}
                          onChange={(e) => updateField("firstName", e.target.value)}
                          aria-invalid={touched && form.firstName.trim().length <= 1}
                          className={[
                            "w-full rounded-2xl border bg-white px-4 py-4 outline-none transition focus:ring-4",
                            touched && form.firstName.trim().length <= 1
                              ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                              : "border-[#d6d9df] focus:border-[#0b5a4e] focus:ring-[#0b5a4e]/10",
                          ].join(" ")}
                        />
                        {touched && form.firstName.trim().length <= 1 && (
                          <p className="mt-2 text-sm text-red-600">
                            Vul uw voornaam in.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0f1720]">
                          Achternaam
                          <RequiredBadge />
                        </label>
                        <input
                          value={form.lastName}
                          onChange={(e) => updateField("lastName", e.target.value)}
                          aria-invalid={touched && form.lastName.trim().length <= 1}
                          className={[
                            "w-full rounded-2xl border bg-white px-4 py-4 outline-none transition focus:ring-4",
                            touched && form.lastName.trim().length <= 1
                              ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                              : "border-[#d6d9df] focus:border-[#0b5a4e] focus:ring-[#0b5a4e]/10",
                          ].join(" ")}
                        />
                        {touched && form.lastName.trim().length <= 1 && (
                          <p className="mt-2 text-sm text-red-600">
                            Vul uw achternaam in.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0f1720]">
                          <Mail className="h-4 w-4 text-[#0b5a4e]" />
                          E-mailadres
                          <RequiredBadge />
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          aria-invalid={touched && form.email.trim().length <= 4}
                          className={[
                            "w-full rounded-2xl border bg-white px-4 py-4 outline-none transition focus:ring-4",
                            touched && form.email.trim().length <= 4
                              ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                              : "border-[#d6d9df] focus:border-[#0b5a4e] focus:ring-[#0b5a4e]/10",
                          ].join(" ")}
                        />
                        {touched && form.email.trim().length <= 4 && (
                          <p className="mt-2 text-sm text-red-600">
                            Vul een geldig e-mailadres in.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0f1720]">
                          <Phone className="h-4 w-4 text-[#0b5a4e]" />
                          Telefoonnummer
                          <RequiredBadge />
                        </label>
                        <input
                          value={form.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          aria-invalid={touched && form.phone.trim().length <= 5}
                          className={[
                            "w-full rounded-2xl border bg-white px-4 py-4 outline-none transition focus:ring-4",
                            touched && form.phone.trim().length <= 5
                              ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                              : "border-[#d6d9df] focus:border-[#0b5a4e] focus:ring-[#0b5a4e]/10",
                          ].join(" ")}
                        />
                        {touched && form.phone.trim().length <= 5 && (
                          <p className="mt-2 text-sm text-red-600">
                            Vul een geldig telefoonnummer in.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#0f1720]">
                        Extra opmerkingen
                      </label>
                      <textarea
                        rows={5}
                        value={form.notes}
                        onChange={(e) => updateField("notes", e.target.value)}
                        className="w-full rounded-2xl border border-[#d6d9df] bg-white px-4 py-4 outline-none transition focus:border-[#0b5a4e] focus:ring-4 focus:ring-[#0b5a4e]/10"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h3 className="text-2xl font-black text-[#0f1720]">
                    Controleer en verzend
                  </h3>
                  <p className="mt-2 text-[#64748b]">
                    Controleer uw ritgegevens en verstuur daarna uw reserveringsaanvraag.
                  </p>

                  <div className="mt-4 rounded-2xl border border-[#f4c542]/40 bg-[#fef7dc] px-4 py-3 text-sm text-[#6b4f00]">
                    Velden met <span className="font-semibold">Verplicht</span> moeten ingevuld zijn
                    voordat u de reservering kunt versturen.
                  </div>

                  <div className="mt-8 grid gap-4">
                    <SummaryRow label="Vertrekadres" value={form.pickup} />
                    <SummaryRow label="Aankomstadres" value={form.destination} />
                    <SummaryRow
                      label="Ophaalmoment"
                      value={formatReadablePickup(
                        form.pickupDate,
                        form.pickupHour,
                        form.pickupMinute
                      )}
                    />
                    <SummaryRow label="Passagiers" value={form.passengers} />
                    <SummaryRow label="Voertuig" value={form.vehicle || "-"} />
                    <SummaryRow
                      label="Naam"
                      value={`${form.firstName} ${form.lastName}`}
                    />
                    <SummaryRow label="E-mail" value={form.email} />
                    <SummaryRow label="Telefoon" value={form.phone} />
                    <SummaryRow label="Opmerking" value={form.notes || "-"} />
                    {quote && (
                      <>
                        <SummaryRow
                          label="Afstand"
                          value={`${quote.route.distanceKm} km`}
                        />
                        <SummaryRow
                          label="Geschatte reistijd"
                          value={quote.route.durationText}
                        />
                        <SummaryRow
                          label="Prijs"
                          value={`€ ${quote.pricing.total.toFixed(2)}`}
                        />
                      </>
                    )}
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={handleReservationSubmit}
                      disabled={reserveLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4c542] px-6 py-4 font-bold text-[#083b34] transition hover:scale-[1.02] disabled:opacity-70"
                    >
                      {reserveLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verzenden...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Reserveer nu
                        </>
                      )}
                    </button>

                    {reserveSuccess && (
                      <p className="mt-4 text-sm font-medium text-green-700">
                        {reserveSuccess}
                      </p>
                    )}

                    {reserveError && (
                      <p className="mt-4 text-sm font-medium text-red-600">
                        {reserveError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={step === 1}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d6d9df] px-5 py-3 font-semibold text-[#0f1720] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Vorige
                </button>

                {step < 4 && (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4c542] px-6 py-3 font-bold text-[#083b34] transition hover:scale-[1.02]"
                  >
                    Volgende
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <aside className="rounded-[1.75rem] bg-[#0b5a4e] p-6 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#f4c542]">
                Uw reservering
              </p>

              <h3 className="mt-4 text-2xl font-black">
                Controleer uw ritgegevens
              </h3>

              <div className="mt-8 space-y-4">
                <InfoCard
                  icon={<MapPin className="h-5 w-5 text-[#f4c542]" />}
                  title="Vertrek"
                  text={form.pickup || "Nog niet ingevuld"}
                />
                <InfoCard
                  icon={<MapPin className="h-5 w-5 text-[#f4c542]" />}
                  title="Bestemming"
                  text={form.destination || "Nog niet ingevuld"}
                />
                <InfoCard
                  icon={<CalendarDays className="h-5 w-5 text-[#f4c542]" />}
                  title="Ophaalmoment"
                  text={formatReadablePickup(
                    form.pickupDate,
                    form.pickupHour,
                    form.pickupMinute
                  )}
                />
                <InfoCard
                  icon={<Users className="h-5 w-5 text-[#f4c542]" />}
                  title="Passagiers"
                  text={`${form.passengers} passagier${form.passengers !== "1" ? "s" : ""}`}
                />
              </div>

              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f4c542]">
                  Belangrijk
                </p>
                <p className="mt-3 leading-7 text-white/85">
                  Controleer uw gegevens zorgvuldig voordat u de aanvraag verzendt.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function VehicleCard({
  active,
  title,
  badge,
  description,
  imageSrc,
  imageAlt,
  onClick,
}: {
  active: boolean;
  title: string;
  badge: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "grid w-full gap-5 rounded-[1.75rem] border p-5 text-left transition md:grid-cols-[220px_1fr]",
        active
          ? "border-[#f4c542] bg-[#0b5a4e] text-white shadow-lg"
          : "border-[#d6d9df] bg-white hover:border-[#0b5a4e]/30",
      ].join(" ")}
    >
      <div className="relative h-[130px] w-full">
        <Image src={imageSrc} alt={imageAlt} fill className="object-contain" />
      </div>

      <div className="flex flex-col justify-center">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-2xl font-black">{title}</h4>
          <span
            className={[
              "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
              active
                ? "bg-white/15 text-[#f4c542]"
                : "bg-[#0b5a4e]/8 text-[#0b5a4e]",
            ].join(" ")}
          >
            {badge}
          </span>
        </div>
        <p
          className={[
            "mt-3 leading-7",
            active ? "text-white/85" : "text-[#475569]",
          ].join(" ")}
        >
          {description}
        </p>
      </div>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-4 sm:grid-cols-[180px_1fr] sm:gap-4">
      <p className="text-sm font-bold text-[#0f1720]">{label}</p>
      <p className="text-[#475569]">{value}</p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div>
          <p className="font-bold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-white/80">{text}</p>
        </div>
      </div>
    </div>
  );
}
