"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createSubmission as createSubmissionSvc,
  deleteSubmission as deleteSubmissionSvc,
} from "@/services/submissions.service";

type SubmissionState = { error: string } | { success: true; id: string } | null;

export async function createSubmission(
  _prevState: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  const { userId } = await requireAdmin();

  const roomId = formData.get("roomId") as string | null;
  const file = formData.get("file") as File | null;

  if (!roomId) {
    return { error: "Room is required." };
  }
  if (!file || file.size === 0) {
    return { error: "Image file is required." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let submission: { id: string };
  try {
    submission = await createSubmissionSvc({ roomId, userId, buffer, mimetype: file.type });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }

  revalidatePath("/archive");
  return { success: true, id: submission.id };
}

export async function deleteSubmission(submissionId: string): Promise<void> {
  await requireAdmin();
  await deleteSubmissionSvc(submissionId);
}
