import type { VehicleType } from "@/types/pricing";

export type ReservationStatus = "pending" | "confirmed" | "rejected";
export type ReservationActionStatus = Exclude<ReservationStatus, "pending">;
export type ReservationDecision = "confirm" | "reject";

export type ReservationRequestBody = {
  pickup: string;
  destination: string;
  pickupDate: string;
  pickupHour: string;
  pickupMinute: string;
  passengers: string;
  vehicle: VehicleType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
};

export type ReservationRecord = {
  id: number;
  status: ReservationStatus;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  pickup: string;
  destination: string;
  pickup_date: string;
  pickup_time: string;
  passengers: number;
  vehicle_type: VehicleType;
  notes: string | null;
  distance_km: number | string;
  duration_text: string;
  price_total: number | string;
  pricing_mode: string;
  admin_note: string | null;
  action_token: string;
  customer_email_sent_at: string | null;
  status_email_sent_at: string | null;
  confirmed_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReservationEmailData = {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickup: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  passengers: string;
  vehicle: VehicleType;
  notes: string;
  distanceKm: number;
  durationText: string;
  priceTotal: number;
  pricingMode: string;
};
