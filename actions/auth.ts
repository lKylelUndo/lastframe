"use server";

import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/redis";
import { loginSchema, createUserSchema } from "@/lib/validations";
import {
  loginUser,
  setLoginCookie,
  logoutUser,
  createUser as createUserSvc,
  toggleUserActive as toggleUserActiveSvc,
  deleteUser as deleteUserSvc,
} from "@/services/auth.service";
import { requireAdmin } from "@/lib/auth";

type ActionState = { error: string } | null;

export async function login(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid credentials" };
  }

  const { email, password } = parsed.data;

  const allowed = await rateLimit(`login:${email}`, 10, 600);
  if (!allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  try {
    const { token } = await loginUser(email, password);
    await setLoginCookie(token);
  } catch {
    return { error: "Invalid credentials" };
  }

  const redirectTo = (formData.get("redirect") as string) || "/dashboard";
  const safeRedirect =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";
  redirect(safeRedirect);
}

export async function logout(): Promise<void> {
  await logoutUser();
  redirect("/login");
}

export async function createUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  try {
    await createUserSvc(name, email, password);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create user" };
  }

  return null;
}

export async function toggleUserActive(userId: string): Promise<void> {
  await requireAdmin();
  await toggleUserActiveSvc(userId);
}

export async function deleteUser(userId: string): Promise<void> {
  await requireAdmin();
  await deleteUserSvc(userId);
}
