import { type NextRequest, NextResponse } from "next/server";
import { listArchive } from "@/services/submissions.service";
import { archiveQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);

  const parsed = archiveQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid query parameters" },
      { status: 400 },
    );
  }

  const { date, roomId, page, pageSize } = parsed.data;

  const result = await listArchive({ date, roomId, page, pageSize });

  return NextResponse.json({
    data: result.data,
    page,
    total: result.total,
  });
}
