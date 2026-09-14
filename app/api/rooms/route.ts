import { NextRequest, NextResponse } from "next/server";
import { listRooms, createRoom } from "@/services/rooms.service";
import { requireAdminApi } from "@/lib/api-helpers";
import { createRoomSchema } from "@/lib/validations";

export async function GET() {
  const rooms = await listRooms();
  return NextResponse.json(rooms);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminApi();

    const body = await request.json();
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { name } = parsed.data;
    await createRoom(name);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create room";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
