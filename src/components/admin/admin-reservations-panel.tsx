"use client";

import { useState } from "react";
import type { ReservationRecord } from "@/types/reservations";

export function AdminReservationsPanel({
  initialReservations,
}: {
  initialReservations: ReservationRecord[];
}) {
  const [items, setItems] = useState(initialReservations);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function updateStatus(
    id: number,
    status: "confirmed" | "rejected",
    adminNote: string
  ) {
    setBusyId(id);

    const response = await fetch(`/api/admin/reservations/${id}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, adminNote }),
    });

    setBusyId(null);

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "Actie mislukt");
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status, admin_note: adminNote } : item
      )
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <ReservationCard
          key={item.id}
          item={item}
          busy={busyId === item.id}
          onConfirm={(note) => updateStatus(item.id, "confirmed", note)}
          onReject={(note) => updateStatus(item.id, "rejected", note)}
        />
      ))}
    </div>
  );
}

function ReservationCard({
  item,
  busy,
  onConfirm,
  onReject,
}: {
  item: ReservationRecord;
  busy: boolean;
  onConfirm: (note: string) => void;
  onReject: (note: string) => void;
}) {
  const [note, setNote] = useState(item.admin_note || "");

  return (
    <div className="rounded-[2rem] border border-[#0b5a4e]/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,32,0.06)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0b5a4e]">
            Reservering #{item.id}
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#0f1720]">
            {item.first_name} {item.last_name}
          </h2>
          <p className="mt-2 text-[#475569]">
            {item.pickup} → {item.destination}
          </p>
        </div>

        <span
          className={[
            "inline-flex rounded-full px-4 py-2 text-sm font-bold",
            item.status === "pending"
              ? "bg-amber-100 text-amber-800"
              : item.status === "confirmed"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-red-100 text-red-800",
          ].join(" ")}
        >
          {item.status}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Info label="E-mail" value={item.email} />
        <Info label="Telefoon" value={item.phone} />
        <Info label="Ophaalmoment" value={`${item.pickup_date} om ${item.pickup_time}`} />
        <Info label="Voertuig" value={item.vehicle_type} />
        <Info label="Passagiers" value={String(item.passengers)} />
        <Info label="Afstand" value={`${item.distance_km} km`} />
        <Info label="Reistijd" value={item.duration_text} />
        <Info label="Prijs" value={`€ ${item.price_total}`} />
      </div>

      <div className="mt-6 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
        <p className="text-sm font-bold text-[#0f1720]">Opmerking klant</p>
        <p className="mt-2 text-[#475569]">{item.notes || "-"}</p>
      </div>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-bold text-[#0f1720]">
          Bericht aan klant
        </label>
        <textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-2xl border border-[#d6d9df] px-4 py-3 outline-none transition focus:border-[#0b5a4e] focus:ring-4 focus:ring-[#0b5a4e]/10"
          placeholder="Optioneel bericht voor de klant"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onConfirm(note)}
          disabled={busy}
          className="rounded-full bg-[#0b5a4e] px-5 py-3 font-bold text-white disabled:opacity-60"
        >
          {busy ? "Bezig..." : "Bevestigen"}
        </button>

        <button
          type="button"
          onClick={() => onReject(note)}
          disabled={busy}
          className="rounded-full bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-60"
        >
          {busy ? "Bezig..." : "Weigeren"}
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-[#fcfcfb] p-4">
      <p className="text-sm font-bold text-[#0f1720]">{label}</p>
      <p className="mt-1 text-[#475569]">{value}</p>
    </div>
  );
}
