import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-helpers";
import { listUsers, createUser } from "@/services/auth.service";
import { createUserSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireAdminApi();
    const users = await listUsers();
    return NextResponse.json(users);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminApi();

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;
    await createUser(name, email, password);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
