"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteRoom } from "@/actions/rooms";

export function RoomActions({
  roomId,
  submissionCount,
}: {
  roomId: string;
  submissionCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <span className="inline-flex items-center gap-2">
      <button
        disabled={isPending || submissionCount > 0}
        onClick={() => {
          if (confirm("Delete this room?")) {
            startTransition(async () => {
              try {
                await deleteRoom(roomId);
                router.refresh();
              } catch {
                alert("Cannot delete room with existing submissions.");
              }
            });
          }
        }}
        className="text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          submissionCount > 0
            ? "Cannot delete room with submissions"
            : "Delete room"
        }
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {submissionCount > 0 && (
        <span className="text-xs text-muted-foreground">
          Has {submissionCount} record{submissionCount !== 1 ? "s" : ""} — delete its records first
        </span>
      )}
    </span>
  );
}
