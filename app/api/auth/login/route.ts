import { NextRequest, NextResponse } from "next/server";
import { loginUser, setLoginCookie } from "@/services/auth.service";
import { rateLimit } from "@/lib/redis";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const allowed = await rateLimit(`login:${email}`, 10, 600);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const { token } = await loginUser(email, password);
    await setLoginCookie(token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }
}
