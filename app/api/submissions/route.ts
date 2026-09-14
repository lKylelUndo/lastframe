import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-helpers";
import { createSubmission } from "@/services/submissions.service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAdminApi();

    const formData = await request.formData();
    const roomId = formData.get("roomId") as string | null;
    const file = formData.get("file") as File | null;

    if (!roomId) {
      return NextResponse.json({ error: "Room is required." }, { status: 400 });
    }
    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "Image file is required." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await createSubmission({
      roomId,
      userId,
      buffer,
      mimetype: file.type,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create submission";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
