import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  signSession,
  setSessionCookie,
  logout as logoutAuth,
} from "@/lib/auth";

export async function loginUser(
  email: string,
  password: string,
): Promise<{ userId: string; token: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new Error("Invalid credentials");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  const token = await signSession({ userId: user.id });
  return { userId: user.id, token };
}

export async function setLoginCookie(token: string): Promise<void> {
  await setSessionCookie(token);
}

export async function logoutUser(): Promise<void> {
  await logoutAuth();
}

export async function createUser(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN" },
  });
}

export async function toggleUserActive(
  userId: string,
): Promise<{ isActive: boolean }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });
  return { isActive: updated.isActive };
}

export async function deleteUser(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
