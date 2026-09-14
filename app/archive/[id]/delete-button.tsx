"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteSubmission } from "@/actions/submissions";

export function DeleteButton({
  id,
  dateParam,
}: {
  id: string;
  dateParam?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      aria-busy={isPending || undefined}
      onClick={() => {
        if (confirm("Delete this record? This cannot be undone.")) {
          startTransition(async () => {
            try {
              await deleteSubmission(id);
              router.push(dateParam ? `/archive?date=${dateParam}` : "/archive");
              router.refresh();
            } catch {
              alert("Could not delete this record.");
            }
          });
        }
      }}
      className="text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
