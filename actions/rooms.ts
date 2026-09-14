"use server";

import { revalidatePath } from "next/cache";
import { createRoomSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import {
  listRooms as listRoomsSvc,
  createRoom as createRoomSvc,
  deleteRoom as deleteRoomSvc,
} from "@/services/rooms.service";

type ActionState = { error: string } | { success: true } | null;

export async function getRooms() {
  return listRoomsSvc();
}

export async function createRoom(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const raw = {
    name: formData.get("name"),
  };

  const parsed = createRoomSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name } = parsed.data;

  try {
    await createRoomSvc(name);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create room" };
  }

  revalidatePath("/admin/rooms");
  return { success: true };
}

export async function deleteRoom(roomId: string): Promise<void> {
  await requireAdmin();
  await deleteRoomSvc(roomId);
}
