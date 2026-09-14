import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export async function requireAdminApi(): Promise<{ userId: string }> {
  const session = await getSession();
  if (!session) {
    throw new HttpError(401, "Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !user.isActive || user.role !== "ADMIN") {
    throw new HttpError(403, "Forbidden");
  }

  return { userId: session.userId };
}
