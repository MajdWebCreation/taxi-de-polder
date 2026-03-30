"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type {
  PricingSettingRecord,
  SpecialRate,
  VehicleType,
} from "@/types/pricing";

type Props = {
  initialSettings: PricingSettingRecord[];
  initialRates: SpecialRate[];
};

type EditablePricingField = keyof Omit<
  PricingSettingRecord,
  "id" | "vehicle_type"
>;
type RateEditableField = Exclude<keyof SpecialRate, "id">;

export function AdminPricingPanel({ initialSettings, initialRates }: Props) {
  const supabase = createClient();

  const [settings, setSettings] = useState<PricingSettingRecord[]>(
    initialSettings
  );
  const [rates, setRates] = useState<SpecialRate[]>(initialRates);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const settingsRef = useRef(settings);
  const ratesRef = useRef(rates);

  const auto = useMemo(
    () => settings.find((item) => item.vehicle_type === "auto"),
    [settings]
  );
  const busje = useMemo(
    () => settings.find((item) => item.vehicle_type === "busje"),
    [settings]
  );

  function updateSetting(
    vehicle: VehicleType,
    field: EditablePricingField,
    value: string
  ) {
    const nextSettings = settingsRef.current.map((item) =>
        item.vehicle_type === vehicle
          ? { ...item, [field]: Number(value) }
          : item
    );
    settingsRef.current = nextSettings;
    setSettings(nextSettings);
  }

  function updateRate(
    id: number,
    field: RateEditableField,
    value: string | number | boolean
  ) {
    const nextRates = ratesRef.current.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    ratesRef.current = nextRates;
    setRates(nextRates);
  }

  function addRate() {
    const tempId = -Date.now();

    const nextRates = [
      ...ratesRef.current,
      {
        id: tempId,
        from_label: "",
        to_label: "Schiphol",
        vehicle_type: "auto" as VehicleType,
        fixed_price: 0,
        is_active: true,
        sort_order: ratesRef.current.length + 1,
      },
    ];

    ratesRef.current = nextRates;
    setRates(nextRates);
  }

  function removeRate(id: number) {
    const nextRates = ratesRef.current.filter((item) => item.id !== id);
    ratesRef.current = nextRates;
    setRates(nextRates);
  }

  function commitFocusedField() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");

    const currentSettings = settingsRef.current;
    const currentRates = ratesRef.current;

    try {
      for (const setting of currentSettings) {
        const { error } = await supabase
          .from("pricing_settings")
          .update({
            base_fare: setting.base_fare,
            price_per_km: setting.price_per_km,
            price_per_minute: setting.price_per_minute,
            minimum_fare: setting.minimum_fare,
            night_surcharge: setting.night_surcharge,
            updated_at: new Date().toISOString(),
          })
          .eq("id", setting.id);

        if (error) throw error;
      }

      const existingIds = currentRates
        .filter((item) => item.id > 0)
        .map((item) => item.id);

      if (existingIds.length > 0) {
        const { error: deleteMissingError } = await supabase
          .from("special_rates")
          .delete()
          .not("id", "in", `(${existingIds.join(",")})`);

        if (deleteMissingError) throw deleteMissingError;
      } else {
        const { error: deleteAllError } = await supabase
          .from("special_rates")
          .delete()
          .gte("id", 0);

        if (deleteAllError) throw deleteAllError;
      }

      for (const rate of currentRates) {
        if (rate.id > 0) {
          const { error } = await supabase
            .from("special_rates")
            .update({
              from_label: rate.from_label,
              to_label: rate.to_label,
              vehicle_type: rate.vehicle_type,
              fixed_price: rate.fixed_price,
              is_active: rate.is_active,
              sort_order: rate.sort_order,
              updated_at: new Date().toISOString(),
            })
            .eq("id", rate.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from("special_rates").insert({
            from_label: rate.from_label,
            to_label: rate.to_label,
            vehicle_type: rate.vehicle_type,
            fixed_price: rate.fixed_price,
            is_active: rate.is_active,
            sort_order: rate.sort_order,
          });

          if (error) throw error;
        }
      }

      setMessage("Opgeslagen.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-[#0b5a4e]/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,32,0.06)]">
        <h2 className="text-2xl font-black text-[#0f1720]">
          Standaard berekening
        </h2>
        <p className="mt-2 text-[#475569]">
          Deze instellingen worden gebruikt als er geen speciaal vast tarief gevonden wordt.
          De geschatte ritprijs wordt vooraf berekend op basis van afstand en actuele reistijd.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {auto ? (
            <PricingCard
              title="Auto"
              item={auto}
              onChange={(field, value) => updateSetting("auto", field, value)}
            />
          ) : null}

          {busje ? (
            <PricingCard
              title="Busje"
              item={busje}
              onChange={(field, value) => updateSetting("busje", field, value)}
            />
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#0b5a4e]/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,32,0.06)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#0f1720]">
              Speciale vaste tarieven
            </h2>
            <p className="mt-2 max-w-3xl text-[#475569]">
              Voeg hier vaste prijzen toe, bijvoorbeeld van een stad naar Schiphol.
              Als een adres deze tekst bevat, krijgt die rit het vaste tarief.
            </p>
          </div>

          <button
            type="button"
            onClick={addRate}
            className="inline-flex rounded-full bg-[#0b5a4e] px-5 py-3 font-bold text-white"
          >
            Nieuw vast tarief
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="grid gap-4 rounded-[1.5rem] border border-[#e2e8f0] bg-[#fcfcfb] p-4 lg:grid-cols-[1fr_1fr_160px_160px_120px_auto]"
            >
              <Field
                label="Van"
                value={rate.from_label}
                onChange={(value) => updateRate(rate.id, "from_label", value)}
                placeholder="Bijv. Beverwijk"
              />
              <Field
                label="Naar"
                value={rate.to_label}
                onChange={(value) => updateRate(rate.id, "to_label", value)}
                placeholder="Bijv. Schiphol"
              />
              <div>
                <label className="mb-2 block text-sm font-bold text-[#0f1720]">
                  Voertuig
                </label>
                <select
                  value={rate.vehicle_type}
                  onChange={(e) =>
                    updateRate(rate.id, "vehicle_type", e.target.value as VehicleType)
                  }
                  className="w-full rounded-2xl border border-[#d6d9df] px-4 py-3"
                >
                  <option value="auto">Auto</option>
                  <option value="busje">Busje</option>
                </select>
              </div>
              <NumberField
                label="Vaste prijs"
                value={rate.fixed_price}
                onChange={(value) => updateRate(rate.id, "fixed_price", Number(value))}
                placeholder="65"
              />
              <div>
                <label className="mb-2 block text-sm font-bold text-[#0f1720]">
                  Actief
                </label>
                <select
                  value={rate.is_active ? "ja" : "nee"}
                  onChange={(e) =>
                    updateRate(rate.id, "is_active", e.target.value === "ja")
                  }
                  className="w-full rounded-2xl border border-[#d6d9df] px-4 py-3"
                >
                  <option value="ja">Ja</option>
                  <option value="nee">Nee</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeRate(rate.id)}
                  className="w-full rounded-full border border-red-200 px-4 py-3 font-semibold text-red-600"
                >
                  Verwijder
                </button>
              </div>
            </div>
          ))}
        </div>

        {rates.length === 0 ? (
          <p className="mt-6 text-[#64748b]">Nog geen speciale tarieven toegevoegd.</p>
        ) : null}
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onMouseDown={commitFocusedField}
          onClick={saveAll}
          disabled={saving}
          className="inline-flex rounded-full bg-[#f4c542] px-6 py-4 font-bold text-[#083b34] transition hover:scale-[1.01] disabled:opacity-70"
        >
          {saving ? "Opslaan..." : "Alles opslaan"}
        </button>

        {message ? <p className="text-sm font-medium text-[#0b5a4e]">{message}</p> : null}
      </div>
    </div>
  );
}

function PricingCard({
  title,
  item,
  onChange,
}: {
  title: string;
  item: PricingSettingRecord;
  onChange: (
    field: EditablePricingField,
    value: string
  ) => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[#e2e8f0] bg-[#fcfcfb] p-5">
      <h3 className="text-xl font-black text-[#0f1720]">{title}</h3>

      <div className="mt-5 grid gap-4">
        <NumberField
          label="Starttarief"
          value={item.base_fare}
          onChange={(value) => onChange("base_fare", value)}
        />
        <NumberField
          label="Prijs per km"
          value={item.price_per_km}
          onChange={(value) => onChange("price_per_km", value)}
        />
        <NumberField
          label="Prijs per minuut"
          value={item.price_per_minute}
          onChange={(value) => onChange("price_per_minute", value)}
        />
        <NumberField
          label="Minimumprijs"
          value={item.minimum_fare}
          onChange={(value) => onChange("minimum_fare", value)}
        />
        <NumberField
          label="Nachttoeslag"
          value={item.night_surcharge}
          onChange={(value) => onChange("night_surcharge", value)}
        />
      </div>
    </div>
  );
}

function parseDecimalInput(value: string) {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [textValue, setTextValue] = useState(String(value));

  useEffect(() => {
    setTextValue(String(value));
  }, [value]);

  function commitValue(nextValue: string) {
    const parsed = parseDecimalInput(nextValue);

    if (parsed === null) {
      setTextValue(String(value));
      return;
    }

    const normalized = String(parsed);
    setTextValue(normalized);
    onChange(normalized);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#0f1720]">
        {label}
      </label>
      <input
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        onBlur={(e) => commitValue(e.target.value)}
        placeholder={placeholder}
        inputMode="decimal"
        className="w-full rounded-2xl border border-[#d6d9df] px-4 py-3 outline-none transition focus:border-[#0b5a4e] focus:ring-4 focus:ring-[#0b5a4e]/10"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#0f1720]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#d6d9df] px-4 py-3 outline-none transition focus:border-[#0b5a4e] focus:ring-4 focus:ring-[#0b5a4e]/10"
      />
    </div>
  );
}
