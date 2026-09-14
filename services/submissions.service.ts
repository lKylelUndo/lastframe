import { prisma } from "@/lib/prisma";
import { uploadBuffer, destroyImage } from "@/lib/cloudinary";
import { cacheGet, cacheSet } from "@/lib/redis";
import redis from "@/lib/redis";
import { manilaDayRange } from "@/lib/dates";

interface ListArchiveParams {
  date?: string;
  roomId?: string;
  page: number;
  pageSize: number;
}

export async function listArchive({ date, roomId, page, pageSize }: ListArchiveParams) {
  const cacheKey = `lastframe:archive:${date ?? "all"}:${roomId ?? "all"}:${page}:${pageSize}`;
  const cached = await cacheGet<{
    data: unknown[];
    total: number;
  }>(cacheKey);
  if (cached) return cached;

  const where: Record<string, unknown> = {};

  if (date) {
    const { start, end } = manilaDayRange(date);
    where.submittedAt = { gte: start, lte: end };
  }

  if (roomId) {
    where.roomId = roomId;
  }

  const [data, total] = await Promise.all([
    prisma.classroomSubmission.findMany({
      where,
      include: { room: true, submittedBy: { select: { id: true, name: true } } },
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.classroomSubmission.count({ where }),
  ]);

  const result = { data, total };
  await cacheSet(cacheKey, result, 60);
  return result;
}

export async function getById(id: string) {
  return prisma.classroomSubmission.findUnique({
    where: { id },
    include: { room: true, submittedBy: { select: { id: true, name: true } } },
  });
}

export async function createSubmission({
  roomId,
  userId,
  buffer,
  mimetype,
}: {
  roomId: string;
  userId: string;
  buffer: Buffer;
  mimetype: string;
}) {
  let result: { secure_url: string; public_id: string };
  try {
    result = await uploadBuffer(buffer, mimetype, "lastframe");
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Upload failed");
  }

  const submission = await prisma.classroomSubmission.create({
    data: {
      roomId,
      submittedById: userId,
      imageUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      submittedAt: new Date(),
    },
    select: { id: true },
  });

  await invalidateArchiveCache();

  return submission;
}

export async function deleteSubmission(id: string): Promise<void> {
  const submission = await prisma.classroomSubmission.findUnique({
    where: { id },
  });
  if (!submission) throw new Error("Submission not found");

  await destroyImage(submission.cloudinaryPublicId);
  await prisma.classroomSubmission.delete({ where: { id } });
  await invalidateArchiveCache();
}

async function invalidateArchiveCache(): Promise<void> {
  try {
    const keys = await redis.keys("lastframe:archive:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // fail-open
  }
}
