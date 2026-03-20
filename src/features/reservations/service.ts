import { getRouteQuoteFromGoogle } from "@/lib/google/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { getComputedPrice } from "@/features/pricing/service";
import type {
  ReservationActionStatus,
  ReservationDecision,
  ReservationEmailData,
  ReservationRecord,
  ReservationRequestBody,
} from "@/types/reservations";

export function mapReservationToEmailData(
  reservation: ReservationRecord
): ReservationEmailData {
  return {
    id: reservation.id,
    customerName: `${reservation.first_name} ${reservation.last_name}`.trim(),
    customerEmail: reservation.email,
    customerPhone: reservation.phone,
    pickup: reservation.pickup,
    destination: reservation.destination,
    pickupDate: String(reservation.pickup_date),
    pickupTime: reservation.pickup_time,
    passengers: String(reservation.passengers),
    vehicle: reservation.vehicle_type,
    notes: reservation.notes || "",
    distanceKm: Number(reservation.distance_km),
    durationText: reservation.duration_text,
    priceTotal: Number(reservation.price_total),
    pricingMode: reservation.pricing_mode,
  };
}

export async function createReservation(input: ReservationRequestBody) {
  const route = await getRouteQuoteFromGoogle({
    origin: input.pickup,
    destination: input.destination,
  });

  const pricing = await getComputedPrice({
    pickup: input.pickup,
    destination: input.destination,
    vehicle: input.vehicle,
    pickupHour: Number(input.pickupHour),
    distanceKm: route.distanceKm,
  });

  const priceTotal = Number(pricing.total);
  const pickupTime = `${input.pickupHour}:${input.pickupMinute}`;
  const actionToken = crypto.randomUUID();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reservations")
    .insert({
      status: "pending",
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
      pickup: input.pickup,
      destination: input.destination,
      pickup_date: input.pickupDate,
      pickup_time: pickupTime,
      passengers: Number(input.passengers),
      vehicle_type: input.vehicle,
      notes: input.notes || null,
      distance_km: route.distanceKm,
      duration_text: route.durationText,
      price_total: priceTotal,
      pricing_mode: pricing.mode,
      action_token: actionToken,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Reservering opslaan mislukt.");
  }

  const reservation = data as ReservationRecord;

  return {
    reservation,
    reservationEmailData: mapReservationToEmailData(reservation),
    actionToken,
  };
}

function buildStatusUpdate(
  status: ReservationActionStatus,
  adminNote: string | null,
  nowIso: string
) {
  if (status === "confirmed") {
    return {
      status,
      admin_note: adminNote,
      confirmed_at: nowIso,
      updated_at: nowIso,
    };
  }

  return {
    status,
    admin_note: adminNote,
    rejected_at: nowIso,
    updated_at: nowIso,
  };
}

export async function getReservationById(id: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ReservationRecord;
}

export async function getReservationByActionToken(token: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("action_token", token)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ReservationRecord;
}

export async function updateReservationStatusById(params: {
  id: number;
  status: ReservationActionStatus;
  adminNote?: string;
}) {
  const supabase = createAdminClient();
  const reservation = await getReservationById(params.id);

  if (!reservation) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const adminNote = params.adminNote?.trim() || null;
  const payload = buildStatusUpdate(params.status, adminNote, nowIso);
  const { error } = await supabase
    .from("reservations")
    .update(payload)
    .eq("id", reservation.id);

  if (error) {
    throw new Error(error.message);
  }

  return {
    reservation: {
      ...reservation,
      ...payload,
    } as ReservationRecord,
    status: params.status,
    adminNote,
    nowIso,
  };
}

export async function updateReservationStatusByActionToken(params: {
  token: string;
  decision: ReservationDecision;
}) {
  const supabase = createAdminClient();
  const reservation = await getReservationByActionToken(params.token);

  if (!reservation) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const status: ReservationActionStatus =
    params.decision === "confirm" ? "confirmed" : "rejected";
  const payload = buildStatusUpdate(status, reservation.admin_note, nowIso);

  const { error } = await supabase
    .from("reservations")
    .update(payload)
    .eq("id", reservation.id);

  if (error) {
    throw new Error(error.message);
  }

  return {
    reservation: {
      ...reservation,
      ...payload,
    } as ReservationRecord,
    status,
    adminNote: reservation.admin_note,
    nowIso,
  };
}

export async function markCustomerPendingEmailSent(id: number, timestamp: string) {
  const supabase = createAdminClient();
  await supabase
    .from("reservations")
    .update({
      customer_email_sent_at: timestamp,
      updated_at: timestamp,
    })
    .eq("id", id);
}

export async function markStatusEmailSent(id: number, timestamp: string) {
  const supabase = createAdminClient();
  await supabase
    .from("reservations")
    .update({
      status_email_sent_at: timestamp,
      updated_at: timestamp,
    })
    .eq("id", id);
}
