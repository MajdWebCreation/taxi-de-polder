import { NextResponse } from "next/server";
import { getAuthenticatedAdminUser } from "@/features/auth/require-admin";
import { deleteReservationById } from "@/features/reservations/service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  const { id } = await params;
  const reservationId = Number(id);

  if (!Number.isFinite(reservationId)) {
    return NextResponse.json(
      { error: "Ongeldig reserverings-ID." },
      { status: 400 }
    );
  }

  try {
    const deletedReservation = await deleteReservationById(reservationId);

    if (!deletedReservation) {
      return NextResponse.json(
        { error: "Reservering niet gevonden." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Reservering verwijderen mislukt.",
      },
      { status: 500 }
    );
  }
}