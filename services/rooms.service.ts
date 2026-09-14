import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";
import redis from "@/lib/redis";

const ROOMS_CACHE_KEY = "lastframe:rooms";

export async function listRooms() {
  const cached = await cacheGet(ROOMS_CACHE_KEY);
  if (cached) return cached;

  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  await cacheSet(ROOMS_CACHE_KEY, rooms);
  return rooms;
}

export async function createRoom(
  name: string,
): Promise<void> {
  const existing = await prisma.room.findUnique({ where: { name } });
  if (existing) {
    throw new Error("A room with this name already exists.");
  }

  await prisma.room.create({ data: { name } });
  await redis.del(ROOMS_CACHE_KEY);
}

export async function deleteRoom(roomId: string): Promise<void> {
  await prisma.room.delete({ where: { id: roomId } });
  await redis.del(ROOMS_CACHE_KEY);
}
