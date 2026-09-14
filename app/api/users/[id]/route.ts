import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-helpers";
import { toggleUserActive, deleteUser } from "@/services/auth.service";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminApi();
    const { id } = await params;

    const result = await toggleUserActive(id);

    return NextResponse.json({ isActive: result.isActive });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to toggle user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminApi();
    const { id } = await params;

    await deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
