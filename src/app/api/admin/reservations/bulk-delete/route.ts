import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdminUser } from "@/features/auth/require-admin";
import {
  deleteAllReservations,
  deleteReservationsByIds,
} from "@/features/reservations/service";

export async function DELETE(request: NextRequest) {
  const admin = await getAuthenticatedAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      ids?: number[];
      deleteAll?: boolean;
    };

    if (body.deleteAll) {
      const result = await deleteAllReservations();

      return NextResponse.json({
        success: true,
        deletedCount: result.deletedCount,
      });
    }

    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id) => Number.isFinite(id)).map(Number)
      : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Geen geldige reserverings-ID's opgegeven." },
        { status: 400 }
      );
    }

    const result = await deleteReservationsByIds(ids);

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Bulk verwijderen van reserveringen mislukt.",
      },
      { status: 500 }
    );
  }
}