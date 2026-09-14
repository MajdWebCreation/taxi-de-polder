import { getRouteQuoteFromGoogle } from "@/lib/google/routes";
import { getComputedPrice } from "@/features/pricing/service";
import {
  deleteAllReservations as deleteAllReservationRows,
  deleteReservation,
  deleteReservationsByIds as deleteReservationRowsByIds,
  insertReservation,
  selectAllReservations,
  selectReservationByActionToken,
  selectReservationById,
  updateReservationEmailTimestamp,
  updateReservationStatus,
} from "@/features/reservations/repository";
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
    durationMinutes: route.durationMinutes,
  });

  const priceTotal = Number(pricing.total);
  const pickupTime = `${input.pickupHour}:${input.pickupMinute}`;
  const actionToken = crypto.randomUUID();

  const reservation = await insertReservation({
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
  });

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

export async function listReservations() {
  return selectAllReservations();
}

export async function getReservationById(id: number) {
  return selectReservationById(id);
}

export async function getReservationByActionToken(token: string) {
  return selectReservationByActionToken(token);
}

export async function updateReservationStatusById(params: {
  id: number;
  status: ReservationActionStatus;
  adminNote?: string;
}) {
  const reservation = await getReservationById(params.id);

  if (!reservation) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const adminNote = params.adminNote?.trim() || null;
  const payload = buildStatusUpdate(params.status, adminNote, nowIso);

  await updateReservationStatus(reservation.id, payload);

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
  const reservation = await getReservationByActionToken(params.token);

  if (!reservation) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const status: ReservationActionStatus =
    params.decision === "confirm" ? "confirmed" : "rejected";
  const payload = buildStatusUpdate(status, reservation.admin_note, nowIso);

  await updateReservationStatus(reservation.id, payload);

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

export async function deleteReservationById(id: number) {
  const reservation = await getReservationById(id);

  if (!reservation) {
    return null;
  }

  await deleteReservation(id);

  return reservation;
}

export async function deleteReservationsByIds(ids: number[]) {
  if (ids.length === 0) {
    return { deletedCount: 0 };
  }

  return {
    deletedCount: await deleteReservationRowsByIds(ids),
  };
}

export async function deleteAllReservations() {
  return {
    deletedCount: await deleteAllReservationRows(),
  };
}

export async function markCustomerPendingEmailSent(id: number, timestamp: string) {
  await updateReservationEmailTimestamp({
    id,
    column: "customer_email_sent_at",
    timestamp,
  });
}

export async function markStatusEmailSent(id: number, timestamp: string) {
  await updateReservationEmailTimestamp({
    id,
    column: "status_email_sent_at",
    timestamp,
  });
}
